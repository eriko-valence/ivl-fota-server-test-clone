var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;
var _ = require('lodash');
const KeyVault = require('azure-keyvault');
const msRestAzure = require('ms-rest-azure');
const helper = require('../Shared/helper');
const apihelper = require('../Shared/apimappings');

module.exports =  function (context, req) {
    let requestMethod = _.get(req, 'method', ''); 
    let sortBy = _.get(req.query, 'sort_by', ''); //example --> sort_by=desc(deviceid)
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
            var connection = new Connection(config); //initiate sql database connection
            connection.on('connect', function(err) {
                if (requestMethod === 'GET') {
                    getDevices(connection); //List All Devices
                } else if (requestMethod === 'POST') {
                    createDevice(connection); //Creates a new device in MFOX DB.
                } else if (requestMethod === 'PUT') {
                    updateDevice(connection); //Modifies existing device in the MFOX DB
                }
            });
        });
    });

   function getDevices(connection) {
        let sqlQuery = 'uspGetAllDevices';
        let error = false;
        request = new Request(sqlQuery, function(err) {
            if (err) { 
                console.log(err.message);
                error = true;
                context.res = {
                    status: 500,             
                    body: {
                        code: 500,
                        error: 'An error occured while retrieving devices from the database.'
                    }
                };
            }
        });
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
                let sort = helper.processSortQueryString(sortBy);
                if (sort.length === 1 ) {
                    let sortColumn = _.get(sort[0], 'column', '');
                    let sortOrder = _.get(sort[0], 'order', '');
                    if (sortColumn !== '' && sortOrder !== '') {
                        devices = _.orderBy(devices, [sortColumn], [sortOrder]);
                    }
                }
                context.res = {
                    status: 200,
                    body: devices
                };
            } else if (!error) {
                context.res = {
                    status: 404,
                    body: 'No devices found on the server side',
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
        if (deviceid !== null) {
            let sqlQuery = 'uspCreateDevice';
            request = new Request(sqlQuery, function(err) {
                if (err) { 
                    console.log(err.message);
                    error = true;
                    context.res = {
                        status: 500,             
                        body: {
                            code: 500,
                            error: 'An error occured while updating this device in the database.'
                        }
                    };
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
        if (deviceid !== null && groupid !== null) {
            let sqlQuery = 'uspUpdateDevice';
            request = new Request(sqlQuery, function(err) {
                if (err) { 
                    console.log(err.message);
                    error = true;
                    context.res = {
                        status: 500,             
                        body: {
                            code: 500,
                            error: 'An error occured while updating this device in the database.'
                        }
                    };
                }
            });
            request.addParameter('deviceid', TYPES.BigInt, deviceid);
            request.addParameter('groupid', TYPES.Int, groupid);
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
            //this is the final event emitted by an azure sql query request
            request.on('requestCompleted', function () {
            if (devices.length > 0) {
                context.res = {
                    status: 200,
                    body: devices[0]
                };
            } else if (!error) {  //there were no t-sql errors, but the updated device info was not returned
                context.res = {
                    status: 500,             
                    body: {
                        error: 'Unable to retieve the updated device from the database.',
                        code: 500
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