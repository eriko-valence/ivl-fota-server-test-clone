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

module.exports =  function (context, req) {
    let requestMethod = _.get(req, 'method', ''); 
    let sortBy = _.get(req.query, 'sort_by', ''); //example --> sort_by=desc(deviceid)
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
        let var3 = keyVaultClient.getSecret(vaultUri, "AzureSqlDatabaseName", "");
        let var4 = keyVaultClient.getSecret(vaultUri, "AzureSqlServerName", "");
        Promise.all([var1, var2, var3, var4]).then(function(results) {
            let azureSqlLoginName = _.get(results[0], 'value', '');
            let azureSqlLoginPass = _.get(results[1], 'value', '');
            let azureSqlDatabaseName = _.get(results[2], 'value', '');
            let azureSqlServerName = _.get(results[3], 'value', '');
            let config = helper.getConfig(azureSqlLoginName, azureSqlLoginPass, azureSqlServerName, azureSqlDatabaseName); //build out azure sql config
            var connection = new Connection(config); //initiate sql database connection
            connection.on('connect', function(err) {
                if (requestMethod === 'GET') {
                    getFirmware(connection); //Returns a list of all firmware versions registered in the MFOX DB.
                } else if (requestMethod === 'POST') {
                    createFirmware(connection); //Adds new firmware release to MFOX DB.
                } else if (requestMethod === 'DELETE') {
                    deleteFirmware(connection); //Deletes existing firmware from MFOX DB
                }
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

   function getFirmware(connection) {
        let error = false;
        let sqlQuery = 'fota_uspGetAllFirmware';
        request = new Request(sqlQuery, function(err) {
            if (err) { 
                let props = errors.getCustomProperties(500, req.method, req.url, err.message, err, req);
                client.trackException({exception: err.message, properties: props});
                error = true;
                context.res = {
                    status: 500,             
                    body: {
                        code: 500,
                        error: 'An error occured while retrieving firmware from the database.'
                    }
                };
                context.done();
            }
        });
        let firmware = [];
        let apiFieldMappings = apihelper.getFirmwareApiFieldMappings();
        //process row from execution of the SQL statement
        request.on('row', function(columns) {
            let fw = helper.processRow(columns,apiFieldMappings);
            if (fw.length === 1) {
                firmware.push(fw[0]);
            }
        });
        //this is the final event emitted by an azure sql query request
        request.on('requestCompleted', function () {
            if (firmware.length > 0) {
                let model = models.getApiResponseModelFirmwareManifest();
                let apiResponseBody = [];
                _.forEach(firmware, function(fw, key) {
                    let bloburi = helper.getAzureBlobUri(fw['blob_container'], fw['blob_name']);
                    let fw_response = _.pick(fw, _.keys(model));
                    fw_response.uri = bloburi.toString().replace("https", "http");
                    apiResponseBody.push(fw_response);
                  });
                  let sort = helper.processSortQueryString(sortBy);
                  if (sort.length === 1 ) {
                      let sortColumn = _.get(sort[0], 'column', '');
                      let sortOrder = _.get(sort[0], 'order', '');
                      if (sortColumn !== '' && sortOrder !== '') {
                        apiResponseBody = _.orderBy(apiResponseBody, [sortColumn], [sortOrder]);
                      }
                  }
                context.res = {
                    status: 200,
                    body: apiResponseBody
                };
            } else if (!error) {
                context.res = {
                    status: 404,
                    body: {
                        code: 404,
                        error: 'No firmware found on server side'
                    }
                };
            }
            context.done();
        });
        connection.callProcedure(request);
    }

    function createFirmware(connection) {
        let error = false;
        let version = _.get(req.body, 'version', null);
        let image = _.get(req.body, 'image', null);
        let signature = _.get(req.body, 'signature', null);
        let md5 = _.get(req.body, 'md5', null);
        if (version !== null && image !== null && signature !== null && md5 !== null) {
            let sqlQuery = 'fota_uspCreateFirmware';
            request = new Request(sqlQuery, function(err) {
                if (err) { 
                    let props = errors.getCustomProperties(500, req.method, req.url, err.message, err, req);
                    client.trackException({exception: err.message, properties: props});
                    error = true;
                    context.res = {
                        status: 500,             
                        body: {
                            code: 500,
                            error: 'An error occured while creating firmware in the database.'
                        }
                    };
                    context.done();
                }
            });
            request.addParameter('version', TYPES.NChar, version);
            request.addParameter('signature', TYPES.NChar, signature);
            request.addParameter('md5', TYPES.NChar, md5);
            request.addParameter('blobname', TYPES.NChar, `${process.env.AzureBlobNamePrefix}${image}`);
            request.addParameter('blobcontainer', TYPES.NChar, process.env.AzureBlobContainer);
            request.addOutputParameter('result', TYPES.Int);

           let firmware = [];
           let apiFieldMappings = apihelper.getFirmwareApiFieldMappings();
           //process row from execution of the SQL statement
           request.on('row', function(columns) {
                let fw = helper.processRow(columns,apiFieldMappings);
                if (fw.length === 1) {
                    let bloburi = helper.getAzureBlobUri(fw[0]['blob_container'], fw[0]['blob_name']);
                    fw[0].uri = bloburi.toString().replace("https", "http");
                    firmware.push(fw[0]);
                }
           });


            //Use this event handler if the usp returns an output parameter
            request.on('returnValue', function (parameterName, value, metadata) {
                if (parameterName === 'result' && value === 1) { //1 = successful  update
                    if (firmware.length > 0) {
                        context.res = {
                            status: 201,
                            body: firmware[0]
                        };
                    }
                } else if (!error) {
                    context.res = {
                        status: 500,
                        body: {
                            code: 500,
                            error: 'Something went wrong while creating the firmware.'
                        }
                    };
                }
                context.done();
            });

            connection.callProcedure(request);
        } else {
            context.res = {
                status: 400,
                body: `Missing required request parameters`
            };
            context.done();   
        }
    }

    function deleteFirmware(connection) {
        let firmware_id = _.get(req.params, 'firmware_version_id', null);

        if (!(helper.isIntegerOnly(firmware_id))) {
            context.res = {
                status: 400,             
                body: {
                    code: 400,
                    error: 'Validation failed for parameter \'firmware_version_id\'. Must be a number.'
                }
            };
            context.done();
        }

        if (firmware_id !== null) {
            let sqlQuery = 'fota_uspDeleteFirmware';
            request = new Request(sqlQuery, function(err) {
                if (err) { 
                    let props = errors.getCustomProperties(500, req.method, req.url, err.message, err, req);
                    client.trackException({exception: err.message, properties: props});
                    error = true;
                    context.res = {
                        status: 500,             
                        body: {
                            code: 500,
                            error: 'An error occured while deleting the firmware from the database.'
                        }
                    };
                    context.done();
                }
            });
            request.addParameter('firmwareid', TYPES.Int, firmware_id);
            request.addOutputParameter('result', TYPES.Int);
            
            //Use this event handler if the usp returns an output parameter
            request.on('returnValue', function (parameterName, value, metadata) { 
                if (parameterName === 'result' && value === 1) {
                    context.res = {
                        status: 200
                    };
                } 
                else if (parameterName === 'result' && value === 2) {
                    context.res = {
                        status: 404,
                        body: {
                            code: 404,
                            error: 'Firmware not found'
                        }
                    };
                } 
                else if (parameterName === 'result' && value === 3) {
                    context.res = {
                        status: 400,
                        body: {
                            code: 400,
                            error: 'There are still groups assigned to this firmware'
                        }
                    };
                } 
                else if (!error) {
                    context.res = {
                        status: 404,
                        body: 'Firmware not found in the database'
                    };
                }
                context.done();
            });
            connection.callProcedure(request);
        } else {
            context.res = {
                status: 400,
                body: `Missing required request parameter`
            };
            context.done();   
        }
    }

    


};