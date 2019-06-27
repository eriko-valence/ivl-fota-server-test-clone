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
    let secret = _.get(process.env, 'AzureADClientSecret', '');
    let clientId = _.get(process.env, 'AzureADClientID', '');
    let domain = _.get(process.env, 'AzureADTenantID', '');
	appInsights.setup().start(); // assuming APPINSIGHTS_INSTRUMENTATIONKEY is in env var
    let client = appInsights.defaultClient;
    msRestAzure.loginWithServicePrincipalSecret(clientId, secret, domain).then((credentials) => {
        const keyVaultClient = new KeyVault.KeyVaultClient(credentials);
        var keyVaultname = _.get(process.env, 'AzureKeyVaultName', '');
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
                    getGroups(connection); //Returns a list of all groups registered in the MFOX DB.
                } else if (requestMethod === 'POST') {
                    createGroup(connection); //Creates a new device group in MFOX DB.
                } else if (requestMethod === 'PUT') {
                    updateGroup(connection); //Modifies existing group in the MFOX DB
                } else if (requestMethod === 'DELETE') {
                    deleteGroup(connection); //Deletes existing group from MFOX DB
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

   function getGroups(connection) {
        let error = false;
        let sqlQuery = 'fota_uspGetAllGroups';
        let request = new Request(sqlQuery, function(err) {
            if (err) { 
                let props = errors.getCustomProperties(500, req.method, req.url, err.message, err, req);
                client.trackException({exception: err.message, properties: props});
                error = true;
                context.res = {
                    status: 500,             
                    body: {
                        code: 500,
                        error: 'An error occured while retrieving groups from the database.'
                    }
                };
                context.done();
            }
        });
        let groups = [];
        let apiFieldMappings = apihelper.getGroupApiFieldMappings();
        //process row from execution of the SQL statement
        request.on('row', function(columns) {
            let group = helper.processRow(columns,apiFieldMappings);
            if (group.length === 1) {
                groups.push(group[0]);
            }
        });
        //this is the final event emitted by an azure sql query request
        request.on('requestCompleted', function () {
            if (groups.length > 0) {
                let sort = helper.processSortQueryString(sortBy);
                if (sort.length === 1 ) {
                    let sortColumn = _.get(sort[0], 'column', '');
                    let sortOrder = _.get(sort[0], 'order', '');
                    if (sortColumn !== '' && sortOrder !== '') {
                        groups = _.orderBy(groups, [sortColumn], [sortOrder]);
                    }
                }
                context.res = {
                    status: 200,
                    body: groups
                };
            } else if (!error) {
                context.res = {
                    status: 404,
                    body: {
                        code: 404,
                        error: 'No groups found on server side'
                    }
                };
            }
            context.done();
        });
        connection.callProcedure(request);
    }

    function createGroup(connection) {
        let error = false;
        let name = _.get(req.body, 'name', null);
        let desiredfwid = _.get(req.body, 'desired_fw_id', null);

        if (!(helper.isIntegerOnly(desiredfwid))) {
            context.res = {
                status: 400,             
                body: {
                    code: 400,
                    error: 'Validation failed for parameter \'desired_fw_id\'. Must be a number.'
                }
            };
            context.done();
        }


        if (name !== null && desiredfwid !== null) {

            if (name.length > 500 || desiredfwid.length > 500) {
                context.res = {
                    status: 400,             
                    body: {
                        code: 400,
                        error: 'String value of greater than 500 characters not allowed.'
                    }
                };
                context.done();
            }

            let sqlQuery = 'fota_uspCreateGroup';
            let request = new Request(sqlQuery, function(err) {
                if (err) { 
                    let props = errors.getCustomProperties(500, req.method, req.url, err.message, err, req);
                    client.trackException({exception: err.message, properties: props});
                    error = true;
                    context.res = {
                        status: 500,             
                        body: {
                            code: 500,
                            error: 'An error occured while creating the group in the database.'
                        }
                    };
                    context.done();
                }
            });
            request.addParameter('name', TYPES.NChar, name);
            request.addParameter('desiredfwid', TYPES.Int, desiredfwid);
            request.addOutputParameter('result', TYPES.Int);
           let groups = [];
           let apiFieldMappings = apihelper.getGroupApiFieldMappings();
           //process row from execution of the SQL statement
           request.on('row', function(columns) {
               let group = helper.processRow(columns,apiFieldMappings);
               if (group.length === 1) {
                   groups.push(group[0]);
               }
           });

            //Use this event handler if the usp returns an output parameter
            request.on('returnValue', function (parameterName, value) {
            if (parameterName === 'result' && value === 1) { //1 = successful  update
                if (groups.length > 0) {
                    context.res = {
                        status: 201,
                        body: groups[0]
                    };
                }
            } else if (!error) {
                context.res = {
                    status: 500,
                    body: {
                        code: 500,
                        error: 'Something went wrong while creating the group.'
                    }
                };
            }
            context.done();
            });

            //this is the final event emitted by an azure sql query request
            request.on('requestCompleted', function () {
            if (groups.length > 0) {
                context.res = {
                    status: 201,
                    body: groups[0]
                };
            } else if (!error) {
                context.res = {
                    status: 404,
                    body: {
                        code: 404,
                        error: 'Created group not found on server side'
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
                    error: 'Missing required request parameter(s)'
                }
            };
            context.done();   
        }
    }

    function updateGroup(connection) {
        let error = false;
        let groupid = _.get(req.params, 'groupid', '');
        let groupname = _.get(req.body, 'name', null);
        let desiredfwid = _.get(req.body, 'desired_fw_id', null);

        if (!(helper.isIntegerOnly(groupid))) {
            context.res = {
                status: 400,             
                body: {
                    code: 400,
                    error: 'Validation failed for parameter \'groupid\'. Must be a number.'
                }
            };
            context.done();
        }

        if (desiredfwid !== null) {

            if (!(helper.isIntegerOnly(desiredfwid))) {
                context.res = {
                    status: 400,             
                    body: {
                        code: 400,
                        error: 'Validation failed for parameter \'desired_fw_id\'. Must be a number.'
                    }
                };
                context.done();
            }

            if (desiredfwid.length > 500 ) {
                context.res = {
                    status: 400,             
                    body: {
                        code: 400,
                        error: 'String value of greater than 500 characters not allowed.'
                    }
                };
                context.done();
            }  
        }

        if (groupid !== null && groupname !== null) {

            if (groupid.length > 500 || groupname.length > 500) {
                context.res = {
                    status: 400,             
                    body: {
                        code: 400,
                        error: 'String value of greater than 500 characters not allowed.'
                    }
                };
                context.done();
            }

            let sqlQuery = 'fota_uspUpdateGroup';
            let request = new Request(sqlQuery, function(err) {
                context.log(err);
                if (err) { 
                    let props = errors.getCustomProperties(500, req.method, req.url, err.message, err, req);
                    client.trackException({exception: err.message, properties: props});
                    error = true;
                    context.res = {
                        status: 500,             
                        body: {
                            code: 500,
                            error: 'An error occured while updating the group in the database.'
                        }
                    };
                    context.done();
                }
            });
            request.addParameter('name', TYPES.NChar, groupname);
            request.addParameter('groupid', TYPES.Int, groupid);
            request.addParameter('desiredfwid', TYPES.Int, desiredfwid);
            request.addOutputParameter('result', TYPES.Int);
            let groups = [];
            //used to map the sql query result set columns to their related api fields
            let apiFieldMappings = apihelper.getGroupApiFieldMappings();
            //process row from execution of the SQL statement
            request.on('row', function(columns) {
               let group = helper.processRow(columns,apiFieldMappings);
               if (group.length === 1) {
                   groups.push(group[0]);
               }
            });

            //Use this event handler if the usp returns an output parameter
            request.on('returnValue', function (parameterName, value) {
                if (parameterName === 'result' && value === 1) { //1 = successful  update
                    if (groups.length > 0) { // make sure the updated group record was returned
                        context.res = {
                            status: 200,
                            body: groups[0]
                        };
                    }
                } else if (parameterName === 'result' && value === 2) { //2 = group does not exist
                    context.res = {
                        status: 404,
                        body: {
                            code: 404,
                            error: 'The group was not found.'
                        }
                    };
                } else if (parameterName === 'result' && value === 5) { //2 = firmware does not exist
                    context.res = {
                        status: 404,
                        body: {
                            code: 404,
                            error: 'Failed to update the group: firmware not found.'
                        }
                    };
                } else if (!error) {
                    context.res = {
                        status: 500,
                        body: {
                            code: 500,
                            error: 'Something went wrong while updating the group.'
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
                    error: 'Missing required request parameter(s).'
                }
            };
            context.done();   
        }
    }

    function deleteGroup(connection) {
        let error = false;
        let groupid = _.get(req.params, 'groupid', null);

        if (!(helper.isIntegerOnly(groupid))) {
            context.res = {
                status: 400,             
                body: {
                    code: 400,
                    error: 'Validation failed for parameter \'groupid\'. Must be a number.'
                }
            };
            context.done();
        }

        if (groupid !== null) {
            let sqlQuery = 'fota_uspDeleteGroup';
            let request = new Request(sqlQuery, function(err) {
                if (err) { 
                    let props = errors.getCustomProperties(500, req.method, req.url, err.message, err, req);
                    client.trackException({exception: err.message, properties: props});
                    error = true;
                    context.res = {
                        status: 500,             
                        body: {
                            code: 500,
                            error: 'An error occured while deleting the group from the database.'
                        }
                    };
                    context.done();
                }
            });
            request.addParameter('groupid', TYPES.Int, groupid);
            request.addOutputParameter('result', TYPES.Int);
            
            //Use this event handler if the usp returns an output parameter
            request.on('returnValue', function (parameterName, value) { 
                if (parameterName === 'result' && value === 1) {
                    context.res = {
                        status: 204
                    };
                }
                else if (parameterName === 'result' && value === 2) {
                    context.res = {
                        status: 404,
                        body: {
                            code: 404,
                            error: 'Group not found'
                        }
                    };
                } 
                else if (parameterName === 'result' && value === 3) {
                    context.res = {
                        status: 400,
                        body: {
                            code: 400,
                            error: 'There are still devices assigned to this group'
                        }
                    };
                } else if (!error) {
                    context.res = {
                        status: 500,
                        body: {
                            code: 500,
                            error: 'Error deleting group'
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
                    error: 'Missing required request parameter(s)'
                }
            };
            context.done();   
        }
    }
};