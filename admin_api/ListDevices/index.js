var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var _ = require('lodash');
const KeyVault = require('azure-keyvault');
const msRestAzure = require('ms-rest-azure');
const helper = require('../Shared/helper');
const apihelper = require('../Shared/apimappings');

module.exports =  function (context, req) {
    let sortBy = _.get(req.query, 'sort_by', ''); //sort_by=asc(group)
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
                getDevices(connection); //grab devices from azure sql
            });
        });
    });

   function getDevices(connection) {
        let sqlQuery = `SELECT * from vwDevice`;
        request = new Request(sqlQuery, function(err) {
            if (err) { console.log(err); }
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
            } else {
                context.res = {
                    status: 404,
                    body: 'No devices found on server side'
                };
            }
            context.done();
        });
        connection.execSql(request);
    }
};