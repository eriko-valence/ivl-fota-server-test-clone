var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;
var _ = require('lodash');
const KeyVault = require('azure-keyvault');
const msRestAzure = require('ms-rest-azure');
const helper = require('../Shared/helper');
const apihelper = require('../Shared/apimappings');
const models = require('../Shared/models');

module.exports = function (context, req) {
    let secret = process.env.AzureADClientSecret;
    let clientId = process.env.AzureADClientID;
    let domain = process.env.AzureADTenantID;
    msRestAzure.loginWithServicePrincipalSecret(clientId, secret, domain).then((credentials) => {
        const keyVaultClient = new KeyVault.KeyVaultClient(credentials);
        var keyVaultname = process.env.AzureKeyVaultName;
        var vaultUri = "https://" + keyVaultname + ".vault.azure.net/";
        let var1 = keyVaultClient.getSecret(vaultUri, "AzureSqlServerLoginName", "");
        let var2 = keyVaultClient.getSecret(vaultUri, "AzureSqlServerLoginPass", "");
        Promise.all([var1, var2]).then(function(results) {
            let azureSqlLoginName = _.get(results[0], 'value', '');
            let azureSqlLoginPass = _.get(results[1], 'value', '');

            let config = helper.getConfig(azureSqlLoginName, azureSqlLoginPass); //build out azure sql config
            var connection = new Connection(config);
            connection.on('connect', function(err) {
                getFirmwareManifest(connection);
            });
        });
    });

    /*
      Returns the manifest for a version of firmware that the server determines that the fridge 
      should download and apply.
    */
    function getFirmwareManifest(connection) {
        let deviceid = _.get(req.params, 'deviceid', ''); //pull deviceid from route parameter
        let reportedVersion = _.get(req.query, 'ver', ''); //pull reported firmware version from query parameter
        let sqlQuery = 'uspGetDeviceFirmwareManifest';
        //represents an azure sql query request that can be executed on a connection
        request = new Request(sqlQuery, function(err) {
            if (err) {console.log(err); }
        });

        request.addParameter('deviceid', TYPES.Int, deviceid);

        let desiredFirmware = [];
        let apiFieldMappings = apihelper.getFirmwareManifestFieldMappings();
        //a row event resulting from execution of the SQL statement
        request.on('row', function(columns) {
            let fw = helper.processRow(columns,apiFieldMappings);
            if (fw.length === 1) {
                desiredFirmware.push(fw[0]);
            }
        });
        //this is the final event emitted by an azure sql query request
        request.on('requestCompleted', function () {
            if (desiredFirmware.length > 0) {
                //Blank response; nothing needs to be done (desired firmware == reported firmware)
                if (desiredFirmware[0]['version'] === reportedVersion) {
                context.res = {
                    status: 204
                };
                } else {
                    let sasToken = helper.generateSasToken(desiredFirmware[0]['blob_container'], desiredFirmware[0]['blob_name'], null);
                    
                    let model = models.getApiResponseModelFirmwareManifest();
                    model = _.pick(desiredFirmware[0], _.keys(model));
                    model.uri = sasToken.uri;

                    context.res = {
                        status: 200,
                        body: model
                    };
                }

            } else {
                context.res = {
                    status: 404,
                    body: 'No record of device on server side'
                };
            }
            context.done();
        });
        connection.callProcedure(request);
    }
}
