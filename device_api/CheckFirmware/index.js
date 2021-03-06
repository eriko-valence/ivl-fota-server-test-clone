var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;
var _ = require('lodash');
const helper = require('../Shared/helper');
const apihelper = require('../Shared/apimappings');
const models = require('../Shared/models');
const errors = require('../Shared/errors');
const appInsights = require("applicationinsights");

module.exports = function (context, req) {    
    var start = new Date()
    console.log('LOAD;BEG;Invocation request received;' + context.invocationId);
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
        appInsights.setup().start(); // assuming APPINSIGHTS_INSTRUMENTATIONKEY is in env var
        let client = appInsights.defaultClient;

        console.log('LOAD;BEG;Get azure key vault secrets (either from key vault or cache);' + context.invocationId);
        helper.getAzureKeyVaultSecrets(context.invocationId, req).then((azureKeyVaultSecrets) => {
            console.log('LOAD;END;Get azure key vault secrets (either from key vault or cache);' + context.invocationId);
            let azureSqlLoginName = _.get(azureKeyVaultSecrets, 'AzureSqlServerLoginName', '');
            let azureSqlLoginPass = _.get(azureKeyVaultSecrets, 'AzureSqlServerLoginPass', '');
            let azureBlobStorageConnectionString = _.get(azureKeyVaultSecrets, 'AzureBlobStorageConnectionString', '');
            let azureSqlDatabaseName = _.get(azureKeyVaultSecrets, 'AzureSqlDatabaseName', '');
            let azureSqlServerName = _.get(azureKeyVaultSecrets, 'AzureSqlServerName', '');
            let config = helper.getConfig(azureSqlLoginName, azureSqlLoginPass, azureSqlServerName, azureSqlDatabaseName); //build out azure sql config
            var connection = new Connection(config);
            console.log('LOAD;BEG;Get azure sql connection;' + context.invocationId);
            connection.on('connect', function(err) {
                if (err) {
                    console.log('LOAD;ERROR;Get azure sql connection;' + context.invocationId);
                    console.log(err);
                    let props = errors.getCustomProperties(500, req.method, req.url, err.message, err, req);
                    client.trackException({exception: err.message, properties: props});
                    //error = true;
                    context.res = {
                        status: 500,             
                        body: {
                            code: 500,
                            error: 'An error occured while retrieving the device manifest from the database.'
                        }
                    };
                    context.done();
                } else {
                    console.log('LOAD;END;Get azure sql connection;' + context.invocationId);
                    getFirmwareManifest(azureBlobStorageConnectionString, connection);
                }
            });
        }).catch((error) => {
            console.log('-------------------------------------------------------------------------');
            console.log('LOAD;END;Get azure sql connection;' + context.invocationId);
            console.log(error);
            console.log('-------------------------------------------------------------------------');
        });






    }

    /*
      Returns the manifest for a version of firmware that the server determines that the fridge 
      should download and apply.
    */
    function getFirmwareManifest(blobConnection, connection) {
        appInsights.setup().start(); // assuming APPINSIGHTS_INSTRUMENTATIONKEY is in env var
        let client = appInsights.defaultClient;
        console.log('LOAD;BEG;Get firmware manifest from azure sql db;' + context.invocationId);
        let deviceid = _.get(req.params, 'deviceid', ''); //pull deviceid from route parameter
        let reportedVersion = _.get(req.query, 'ver', ''); //pull reported firmware version from query parameter
        let sqlQuery = 'fota_uspGetDeviceFirmwareManifest';
        //represents an azure sql query request that can be executed on a connection
        let request = new Request(sqlQuery, function(err) {
            connection.close();
            if (err) {
                console.log('LOAD;ERROR;Get firmware manifest from azure sql db;' + context.invocationId);
                console.log('************************************************************************SQL Query Error')
                console.log(err);
                let props = errors.getCustomProperties(500, req.method, req.url, err.message, err, req);
                client.trackException({exception: err.message, properties: props});
                context.res = {
                    status: 500,             
                    body: {
                        code: 500,
                        error: 'An error occured while retrieving the device manifest from the database.'
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
            console.log('LOAD;END;Get firmware manifest from azure sql db;' + context.invocationId);
            var end = new Date() - start;
            console.log('LOAD;END;Execution time;' + context.invocationId +';' + end);
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
                            body: 'An error occured while retrieving the device manifest from the database.'
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
