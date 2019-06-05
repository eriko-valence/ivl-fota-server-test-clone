var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;
var _ = require('lodash');
const KeyVault = require('azure-keyvault');
const msRestAzure = require('ms-rest-azure');
const helper = require('../Shared/helper');
const apihelper = require('../Shared/apimappings');
const models = require('../Shared/models');
const errors = require('../Shared/errors');
const appInsights = require("applicationinsights");

module.exports = function (context, req) {
    let deviceid = _.get(req.params, 'deviceid', ''); //pull deviceid from route parameter
    let reportedVersion = _.get(req.query, 'ver', null); //pull reported firmware version from query parameter
    console.log(reportedVersion);
    if (!(helper.isIntegerOnly(deviceid))) {
        context.res = {
            status: 400,             
            body: {
                code: 400,
                error: 'Invalid fridge id route parameter'
            }
        };
        context.done();
    } else if (reportedVersion === null) {
        context.res = {
            status: 400,             
            body: {
                code: 400,
                error: 'missing ver query parameter'
            }
        };
        context.done();
    } else if (!(helper.isVersionValidFormat(reportedVersion))) {
        context.res = {
            status: 400,             
            body: {
                code: 400,
                error: 'invalid fridge version'
            }
        };
        context.done();
    } else {
        let secret = process.env.AzureADClientSecret;
        let clientId = process.env.AzureADClientID;
        let domain = process.env.AzureADTenantID;
        appInsights.setup().start(); // assuming APPINSIGHTS_INSTRUMENTATIONKEY is in env var
        let client = appInsights.defaultClient;
        msRestAzure.loginWithServicePrincipalSecret(clientId, secret, domain).then((credentials) => {
            const keyVaultClient = new KeyVault.KeyVaultClient(credentials);
            var keyVaultname = process.env.AzureKeyVaultName;
            var vaultUri = "https://" + keyVaultname + ".vault.azure.net/";
            let var1 = keyVaultClient.getSecret(vaultUri, "AzureSqlServerLoginName", "");
            let var2 = keyVaultClient.getSecret(vaultUri, "AzureSqlServerLoginPass", "");
            let var3 = keyVaultClient.getSecret(vaultUri, "AzureBlobStorageConnectionString", "");
            let var4 = keyVaultClient.getSecret(vaultUri, "AzureSqlDatabaseName", "");
            let var5 = keyVaultClient.getSecret(vaultUri, "AzureSqlServerName", "");
            Promise.all([var1, var2, var3, var4, var5]).then(function(results) {
                let azureSqlLoginName = _.get(results[0], 'value', '');
                let azureSqlLoginPass = _.get(results[1], 'value', '');
                let azureBlobStorageConnectionString = _.get(results[2], 'value', '');
                let azureSqlDatabaseName = _.get(results[3], 'value', '');
                let azureSqlServerName = _.get(results[4], 'value', '');
                let config = helper.getConfig(azureSqlLoginName, azureSqlLoginPass, azureSqlServerName, azureSqlDatabaseName); //build out azure sql config
                var connection = new Connection(config);
                connection.on('connect', function(err) {
                    getFirmwareManifest(azureBlobStorageConnectionString, connection);
                });
            });
        }).catch((err) => {
            if (err) {
                console.log(err);
                let props = errors.getCustomProperties(500, req.method, req.url, err.message, err, req);
                client.trackException({exception: err.message, properties: props});
                error = true;
                context.res = {
                    status: 500,             
                    body: {
                        code: 500,
                        error: 'An error occured while retrieving devices from the database.'
                    }
                };
                context.done();
            }
          });
    }

    /*
      Returns the manifest for a version of firmware that the server determines that the fridge 
      should download and apply.
    */
    function getFirmwareManifest(blobConnection, connection) {
        let deviceid = _.get(req.params, 'deviceid', ''); //pull deviceid from route parameter
        let reportedVersion = _.get(req.query, 'ver', ''); //pull reported firmware version from query parameter
        let sqlQuery = 'fota_uspGetDeviceFirmwareManifest';
        //represents an azure sql query request that can be executed on a connection
        request = new Request(sqlQuery, function(err) {
            if (err) {
                console.log(err);
                let props = errors.getCustomProperties(500, req.method, req.url, err.message, err, req);
                client.trackException({exception: err.message, properties: props});
                context.res = {
                    status: 500,             
                    body: {
                        code: 500,
                        error: 'An error occured while retrieving devices from the database.'
                    }
                };
                context.done();
            }
        });

        request.addParameter('deviceid', TYPES.VarChar, deviceid);

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

                let desiredVersion = _.get(desiredFirmware[0], 'version', '');
                /*
                The Cloud Device API needs to make sure the desiredFirmware version sent to fridges 
                is always newer than the reportedFirmware version sent by the fridge.  If not, it will 
                not notify client of available FW (i.e. “everything is fine” 204 response is required 
                when the fridge reported version is newer, or the same, than the SQL database resident 
                desired version).
                */
                if (!helper.isVersionNewer(reportedVersion, desiredVersion)) {
                context.res = {
                    status: 204
                };
                } else {
                    let blobContainer = _.get(desiredFirmware[0], 'blob_container', null);
                    let blobName = _.get(desiredFirmware[0], 'blob_name', null);
                    if (blobContainer !== null && blobName !== null) {
                        let sasToken = helper.generateSasToken(blobConnection, blobContainer, blobName, null);             
                        let model = models.getApiResponseModelFirmwareManifest();
                        model = _.pick(desiredFirmware[0], _.keys(model));
                        model.uri = sasToken.uri.toString().replace("https", "http");
                        context.res = {
                            status: 200,
                            body: model
                        };
                    } else {
                        let errMsg = 'desired firmware blob container and/or name missing';
                        let props = errors.getCustomProperties(500, req.method, req.url, errMsg, null, req);
                        client.trackException({exception: errMsg, properties: props});
                        context.res = {
                            status: 500,
                            body: 'An error occured while retrieving devices from the database.'
                        };
                    }
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
