var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var azure = require('azure-storage');
var _ = require('lodash');
const KeyVault = require('azure-keyvault');
const msRestAzure = require('ms-rest-azure');

module.exports = function (context, req) {

    let secret = process.env.AzureADClientSecret;
    let clientId = process.env.AzureADClientID;
    let domain = process.env.AzureADTenantID;

    // The ms-rest-azure library allows us to login with MSI by providing the resource name. In this case the resource is Key Vault.
    // For public regions the resource name is Key Vault
    //msRestAzure.loginWithAppServiceMSI({resource: 'https://vault.azure.net'}).then( (credentials) => {
    msRestAzure.loginWithServicePrincipalSecret(clientId, secret, domain).then((credentials) => {
        const keyVaultClient = new KeyVault.KeyVaultClient(credentials);

        var keyVaultname = process.env.AzureKeyVaultName;
        var vaultUri = "https://" + keyVaultname + ".vault.azure.net/";

        let var1 = keyVaultClient.getSecret(vaultUri, "AzureSqlServerLoginName", "");
        let var2 = keyVaultClient.getSecret(vaultUri, "AzureSqlServerLoginPass", "");

        Promise.all([var1, var2]).then(function(results) {
            //azure sql creds pulled from azure key vault
            let azureSqlLoginName = _.get(results[0], 'value', '');
            let azureSqlLoginPass = _.get(results[1], 'value', '');

            //azure sql database connection configuration
            var config =
            {
                authentication: {
                    options: {
                        userName: azureSqlLoginName,
                        password: azureSqlLoginPass
                    },
                    type: 'default'
                },
                server: process.env.AzureSqlServerName,
                options:
                {
                    database: process.env.AzureSqlDatabaseName,
                    encrypt: true
                }
            };
                    //initiate sql database connection
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

        //let deviceid = req.params['deviceid']; //pull deviceid from route parameter
        let deviceid = _.get(req.params, 'deviceid', ''); //pull deviceid from route parameter
        let reportedVersion = _.get(req.query, 'ver', ''); //pull reported firmware version from query parameter
        //query to see if there is a desired firmware version newer than the reported version 
        let sqlQuery = `SELECT * from vwCheckFirmware where DeviceId = '${deviceid}'`;
        console.log('q: ' + sqlQuery);

        //represents an azure sql query request that can be executed on a connection
        request = new Request(sqlQuery, function(err) {
            if (err) {
                console.log(err);
            }
        });

        let desiredFirmware = [];

        //a row event resulting from execution of the SQL statement
        request.on('row', function(columns) {
            let fw = {}
            columns.forEach(function(column) {
                fw[column.metadata.colName] = column.value;
            });
            desiredFirmware.push(fw);
        });

        //this is the final event emitted by an azure sql query request
        request.on('requestCompleted', function () {
            
            if (desiredFirmware.length > 0) {
                //Blank response; nothing needs to be done (reported firmware == desired firmware)
                if (desiredFirmware[0]['DesiredVersion'] === reportedVersion) {
                
                context.res = {
                    status: 204
                };
                } else {
                    let sasToken = generateSasToken(desiredFirmware[0]['BlobContainer'], desiredFirmware[0]['BlobName'], null);
                    context.res = {
                        status: 200,
                        body: {
                            version: desiredFirmware[0]['DesiredVersion'],
                            signature: desiredFirmware[0]['Signature'],
                            uri: sasToken.uri,
                            md5: desiredFirmware[0]['Md5']
                        }
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
        connection.execSql(request);
    }

    /*
      Returns a SAS token for Azure Storage for the specified container. 
      You can also optionally specify a particular blob name and access permissions. 
      To learn more, see https://github.com/Azure-Samples/functions-dotnet-sas-token/blob/master/README.md
    */
   function generateSasToken(container, blobName, permissions) {
        var connString = process.env.AzureWebJobsStorage;
        var blobService = azure.createBlobService(connString);

        // Create a SAS token that expires in an hour
        // Set start time to five minutes ago to avoid clock skew.
        var startDate = new Date();
        startDate.setMinutes(startDate.getMinutes() - 5);
        var expiryDate = new Date(startDate);
        expiryDate.setMinutes(startDate.getMinutes() + 60);

        permissions = permissions || azure.BlobUtilities.SharedAccessPermissions.READ;

        var sharedAccessPolicy = {
            AccessPolicy: {
                Permissions: permissions,
                Start: startDate,
                Expiry: expiryDate
            }
        };
        var sasToken = blobService.generateSharedAccessSignature(container, blobName, sharedAccessPolicy);
        
        return {
            token: sasToken,
            uri: blobService.getUrl(container, blobName, sasToken, true)
        };
    }

}
