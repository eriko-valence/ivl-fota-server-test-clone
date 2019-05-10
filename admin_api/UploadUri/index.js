const helper = require('../Shared/helper');
var _ = require('lodash');
const msRestAzure = require('ms-rest-azure');
const KeyVault = require('azure-keyvault');

module.exports = function (context, req) {
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
        let var1 = keyVaultClient.getSecret(vaultUri, "AzureBlobStorageConnectionString", "");
        Promise.all([var1]).then(function(results) {
            let azureBlobStorageConnectionString = _.get(results[0], 'value', '');
            if (requestMethod === 'GET') {
                createAzureStorageBlobSas(azureBlobStorageConnectionString); // get firmware upload URI
            }
        });
    });

    function createAzureStorageBlobSas(connection) {
        let name = _.get(req.query, 'name', null); //pull deviceid from route parameter
        if (name !== null) {
            name = `${process.env.AzureBlobNamePrefix}${name}`;
        }
        // The following values can be used for permissions: 
        // "a" (Add), "r" (Read), "w" (Write), "d" (Delete), "l" (List)
        // Concatenate multiple permissions, such as "rwa" = Read, Write, Add
        let sasToken = helper.generateSasToken(connection, process.env.AzureBlobContainer, name, "racwl");
    
        let bodySasUri = {sas_uri: sasToken.uri};
    
        context.res = {
            status: 200,
            body: bodySasUri
        };
        context.done();   
    }
};