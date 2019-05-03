var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
//var TYPES = require('tedious').TYPES;
var _ = require('lodash');
const KeyVault = require('azure-keyvault');
const msRestAzure = require('ms-rest-azure');
const helper = require('../Shared/helper');
const apihelper = require('../Shared/apimappings');
//const models = require('../Shared/models');

module.exports =  function (context, req) {
    let requestMethod = _.get(req, 'method', ''); 
    console.log(requestMethod);
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
                    getGroups(connection); //Returns a list of all groups registered in the MFOX DB.
                } else if (requestMethod === 'POST') {
                    //createGroup(connection); //Creates a new device group in MFOX DB.
                } else if (requestMethod === 'PUT') {
                    //updateGroup(connection); //Modifies existing group in the MFOX DB
                } else if (requestMethod === 'DELETE') {
                    //deleteGroup(connection); //Deletes existing group from MFOX DB
                }
            });
        });
    });

   function getGroups(connection) {
        let sqlQuery = 'uspGetAllGroups';
        request = new Request(sqlQuery, function(err) {
            if (err) { console.log(err); }
        });
        let groups = [];
        let apiFieldMappings = apihelper.getGroupApiFieldMappings();
        //process row from execution of the SQL statement
        request.on('row', function(columns) {
            let device = helper.processRow(columns,apiFieldMappings);
            if (device.length === 1) {
                groups.push(device[0]);
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
            } else {
                context.res = {
                    status: 404,
                    body: 'No groups found on server side'
                };
            }
            context.done();
        });
        connection.callProcedure(request);
    }
};