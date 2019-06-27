var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;
var _ = require('lodash');
const KeyVault = require('azure-keyvault');
const msRestAzure = require('ms-rest-azure');
const helper = require('../Shared/helper');
const apihelper = require('../Shared/apimappings');
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
            connection.on('connect', function() {
                if (requestMethod === 'GET') {
                    getDevices(connection); //List All Devices
                } else if (requestMethod === 'POST') {
                    createDevice(connection); //Creates a new device in MFOX DB.
                } else if (requestMethod === 'PUT') {
                    updateDevice(connection); //Modifies existing device in the MFOX DB
                }
            });
        }).catch((err) => {
            if (err) {
                console.log(err);
                let props = errors.getCustomProperties(500, req.method, req.url, err.message, err, req);
                client.trackException({exception: err.message, properties: props});
                context.res = {
                    status: 500,             
                    body: {
                        code: 500,
                        error: 'An error occured while connecting to the database.'
                    }
                };
                context.done();
            }
          });
    }).catch((err) => {
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

   function getDevices(connection) {
        let sqlQuery = 'fota_uspGetAllDevices';
        let error = false;
        let devices = [];
        let apiFieldMappings = apihelper.getDeviceApiFieldMappings();
        let sort = helper.processSortQueryString(sortBy);
        if (sort.length === 1 ) {
            let sortCol = _.get(sort[0], 'column', null);
            let sortOrder = _.get(sort[0], 'order', null);
            var validSortCols = _.values(apiFieldMappings);
            if (!_.includes(validSortCols, sortCol)) {
                context.res = {
                    status: 400,             
                    body: {
                        code: 400,
                        error: `Sort column '${sortCol}' is not valid.`
                    }
                };
                context.done();
            } else if (!_.includes(['asc', 'desc'], sortOrder)) {
                context.res = {
                    status: 400,             
                    body: {
                        code: 400,
                        error: `Sort order '${sortOrder}' is not valid. Use either 'asc' or 'desc'.`
                    }
                };
                context.done();
            }
        }
        
        let request = new Request(sqlQuery, function(err) {
            if (err) { 
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
        //process row from execution of the SQL statement
        request.on('row', function(columns) {
            let device = helper.processRow(columns,apiFieldMappings);
            if (device.length === 1) {
                devices.push(device[0]);
            }
        });
        //this is the final event emitted by an azure sql query request
        request.on('requestCompleted', function () {
            if (devices.length > 0) {
                if (sort.length === 1 ) {
                    let sortColumn = _.get(sort[0], 'column', '');
                    let sortOrder = _.get(sort[0], 'order', '');
                    if (sortColumn !== '' && sortOrder !== '') {
                        devices = _.orderBy(devices, [sortColumn], [sortOrder]);
                    }
                } else {
                    devices = _.orderBy(devices, ['deviceid'], ['asc']);
                }
                context.res = {
                    status: 200,
                    body: devices
                };
            } else if (!error) {
                context.res = {
                    status: 404,
                    body: {
                        code: 404,
                        error: 'No devices found on the server side'
                    }
                };
            }
            context.done();
        });
        connection.callProcedure(request);
    }

    function createDevice(connection) {
        let error = false;
        let deviceid = _.get(req.body, 'deviceid', null);
        let groupid = _.get(req.body, 'group_id', null);

        if (!(helper.isIntegerOnly(deviceid))) {
            context.res = {
                status: 400,             
                body: {
                    code: 400,
                    error: 'Validation failed for deviceid \'desired_fw_id\'. Must be a number.'
                }
            };
            context.done();
        }

        if (!(helper.isIntegerOnly(groupid))) {
            context.res = {
                status: 400,             
                body: {
                    code: 400,
                    error: 'Validation failed for deviceid \'group_id\'. Must be a number.'
                }
            };
            context.done();
        }


        if (deviceid !== null) {
            let sqlQuery = 'uspCreateDevice';
            let request = new Request(sqlQuery, function(err) {
                if (err) { 
                    let props = errors.getCustomProperties(500, req.method, req.url, err.message, err, req);
                    client.trackException({exception: err.message, properties: props});
                    error = true;
                    context.res = {
                        status: 500,             
                        body: {
                            code: 500,
                            error: 'An error occured while creating this device in the database.'
                        }
                    };
                    context.done();
                }
            });
            request.addParameter('deviceid', TYPES.BigInt, deviceid);
            request.addParameter('groupid', TYPES.NChar, groupid);
            let devices = [];
            let apiFieldMappings = apihelper.getDeviceApiFieldMappings();
            //process row from execution of the SQL statement
            request.on('row', function(columns) {
                let device = helper.processRow(columns,apiFieldMappings);
                if (device.length === 1) {
                    devices.push(device[0]);
                }
            });
            //this is the final event emitted by an azure sql query request
            request.on('requestCompleted', function () {
            if (devices.length > 0) {
                context.res = {
                    status: 201,
                    body: devices[0]
                };
            } else if (!error) {
                context.res = {
                    status: 404,
                    body: {
                        code: 404,
                        error: 'Created device not found on the server side'
                    }
                };
            }
            context.done();
            });
            connection.callProcedure(request);
        } else {
            context.res = {
                status: 400,
                body: {
                    code: 400,
                    error: 'Missing required request parameters'
                }
            };
            context.done();   
        }
    }

    function updateDevice(connection) {
        let error = false;
        let deviceid = _.get(req.params, 'deviceid', ''); //pull deviceid from route parameter
        let groupid = _.get(req.body, 'group_id', null);

        if (!(helper.isIntegerOnly(deviceid))) {
            context.res = {
                status: 400,             
                body: {
                    code: 400,
                    error: 'Validation failed for request parameter \'deviceid\'. Must be a number.'
                }
            };
            context.done();
        }

        if (!(helper.isIntegerOnly(groupid))) {
            context.res = {
                status: 400,             
                body: {
                    code: 400,
                    error: 'Validation failed for request parameter \'group_id\'. Must be a number.'
                }
            };
            context.done();
        }

        if (deviceid !== null && groupid !== null) {

            if (deviceid.length > 500 || groupid.length > 500) {
                context.res = {
                    status: 400,             
                    body: {
                        code: 400,
                        error: 'String value of greater than 500 characters are allowed.'
                    }
                };
                context.done();
            }

            let sqlQuery = 'fota_uspUpdateDevice';
            let request = new Request(sqlQuery, function(err) {
                if (err) { 
                    let props = errors.getCustomProperties(500, req.method, req.url, err.message, err, req);
                    client.trackException({exception: err.message, properties: props});
                    error = true;
                    context.res = {
                        status: 500,             
                        body: {
                            code: 500,
                            error: 'An error occured while updating this device in the database.'
                        }
                    };
                    context.done();
                }
            });
            request.addParameter('deviceid', TYPES.VarChar, deviceid);
            request.addParameter('groupid', TYPES.Int, groupid);
            request.addOutputParameter('result', TYPES.Int);
            let devices = [];
            //used to map the sql query result set columns to their related api fields
            let apiFieldMappings = apihelper.getDeviceApiFieldMappings();
            //process row from execution of the SQL statement
            request.on('row', function(columns) {
               let device = helper.processRow(columns,apiFieldMappings);
               if (device.length === 1) {
                   devices.push(device[0]);
               }
            });

            //Use this event handler if the usp returns an output parameter
            request.on('returnValue', function (parameterName, value) {
                if (parameterName === 'result' && value === 1) { //1 = successful  update
                    if (devices.length > 0) { // make sure the updated device record was returned
                        context.res = {
                            status: 200,
                            body: devices[0]
                        };
                    }
                } else if (parameterName === 'result' && value === 2) { //2 = device does not exist
                    context.res = {
                        status: 404,
                        body: {
                            code: 404,
                            error: 'The device was not found.'
                        }
                    };
                } else if (parameterName === 'result' && value === 5) { //5 = group does not exist
                    context.res = {
                        status: 404,
                        body: {
                            code: 404,
                            error: 'Failed to update the device: group not found.'
                        }
                    };
                } else if (!error) {
                    context.res = {
                        status: 500,
                        body: {
                            code: 500,
                            error: 'Something went wrong while updating the device.'
                        }
                    };
                }
                context.done();
            });

            connection.callProcedure(request);
        } else {
            context.res = {
                status: 400,
                body: {
                    code: 400,
                    error: 'Missing required request parameters'
                }
            };
            context.done();   
        }
    }
};