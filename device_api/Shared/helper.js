var _ = require('lodash');
var azure = require('azure-storage');
const msRestAzure = require('ms-rest-azure');
const appInsights = require("applicationinsights");
const KeyVault = require('azure-keyvault');

// secrets to pull from azure key vault
var azureKeyVaultSecrets = {
    AzureSqlServerLoginName: undefined,
    AzureSqlServerLoginPass: undefined,
    AzureBlobStorageConnectionString: undefined,
    AzureSqlDatabaseName: undefined,
    AzureSqlServerName: undefined
};

// cache for the secrets from azure key vault for this period of time
var cacheExpiration = 300000;
var timeToLive = undefined;

module.exports = {
    getAzureKeyVaultSecrets(invocationId) {
        return new Promise(function(resolve, reject) {
            if (timeToLive === undefined) {
                timeToLive = new Date();
            }
            // only go out to azure key vault if the secrets are not cached
            if ((!_.values(azureKeyVaultSecrets).some(x => x !== undefined)) || module.exports.isExpired(timeToLive, invocationId) ) {
                let secret = _.get(process.env, 'AzureADClientSecret', '');
                let clientId = _.get(process.env, 'AzureADClientID', '');
                let domain = _.get(process.env, 'AzureADTenantID');
                appInsights.setup().start(); // assuming APPINSIGHTS_INSTRUMENTATIONKEY is in env var
                let client = appInsights.defaultClient;
                console.log('LOAD;BEG;Get azure ad application token credentials;' + invocationId);
                msRestAzure.loginWithServicePrincipalSecret(clientId, secret, domain).then((credentials) => {
                    console.log('LOAD;END;Get azure ad application token credentials;' + invocationId);
                    const keyVaultClient = new KeyVault.KeyVaultClient(credentials);
                    var keyVaultname = _.get(process.env, 'AzureKeyVaultName', '');
                    var vaultUri = "https://" + keyVaultname + ".vault.azure.net/";
                    let var1 = keyVaultClient.getSecret(vaultUri, "AzureSqlServerLoginName", "");
                    let var2 = keyVaultClient.getSecret(vaultUri, "AzureSqlServerLoginPass", "");
                    let var3 = keyVaultClient.getSecret(vaultUri, "AzureBlobStorageConnectionString", "");
                    let var4 = keyVaultClient.getSecret(vaultUri, "AzureSqlDatabaseName", "");
                    let var5 = keyVaultClient.getSecret(vaultUri, "AzureSqlServerName", "");
                    console.log('LOAD;BEG;Get azure key vault secrets from azure key vault;' + invocationId);
                    Promise.all([var1, var2, var3, var4, var5]).then(function(results) {
                        azureKeyVaultSecrets.AzureSqlServerLoginName = _.get(results[0], 'value', '');
                        azureKeyVaultSecrets.AzureSqlServerLoginPass = _.get(results[1], 'value', '');
                        azureKeyVaultSecrets.AzureBlobStorageConnectionString = _.get(results[2], 'value', '');
                        azureKeyVaultSecrets.AzureSqlDatabaseName = _.get(results[3], 'value', '');
                        azureKeyVaultSecrets.AzureSqlServerName = _.get(results[4], 'value', '');
                        console.log('LOAD;END;Get azure key vault secrets from azure key vault;' + invocationId);
                        resolve(azureKeyVaultSecrets);
                    }).catch((err) => {
                        console.log('LOAD;ERR;Get azure key vault secrets from azure key vault;' + invocationId);
                        if (err) {
                            console.log(err);
                            let props = errors.getCustomProperties(500, req.method, req.url, err.message, err, req);
                            client.trackException({exception: err.message, properties: props});
                            reject(err);
                        }
                    });
                }).catch((err) => {
                    console.log('LOAD;ERR;Get azure ad application token credentials;' + invocationId);
                    if (err) {
                        console.log(err);
                        let props = errors.getCustomProperties(500, req.method, req.url, err.message, err, req);
                        client.trackException({exception: err.message, properties: props});
                        error = true;
                        reject(err);
                    }
                });
            } else {
                //no need to make api calls to azure key vault as the secrets are already cached
                console.log('LOAD;BEG;Get azure key vault secrets from cache;' + invocationId);
                console.log('LOAD;END;Get azure key vault secrets from cache;' + invocationId);
                resolve(azureKeyVaultSecrets);
            }
        })
},

isExpired: function (t, invocationId) {
    var duration = new Date() - t;
    console.log('duration: ' + duration);
    console.log('LOAD;BEG;Check cache TTL;' + invocationId);
    if (duration >= cacheExpiration) {
        console.log('LOAD;END;Check cache TTL - refresh secrets cache from azure key vault instance;' + invocationId);
        console.log('timeToLive (before): ' + timeToLive);
        timeToLive = new Date();
        console.log('timeToLive (after): ' + timeToLive);
        return true;
    } else {
        console.log('LOAD;END;Check cache TTL - pull secrets from azure key vault cache;' + invocationId);
        return false;
    }
},
    
    getConfig: function(login, pass, svrname, dbname) {
        return {
            authentication: {
                options: {
                    userName: login,
                    password: pass
                },
                type: 'default'
            },
            server: svrname,
            options:
            {
                database: dbname,
                encrypt: true
            }
        };
    },

    processRow: function(columns, apiFieldMappings) {
        let record = [];
        let device = {};
        let errorDetected = 0;
        columns.forEach(function(column) {
            let apiField = _.get(apiFieldMappings, column.metadata.colName, '');
            if (apiField === '') {
                errorDetected = 1;
                console.log('api field mapping failed for database column ' + column.metadata.colName);
            } else {
                device[apiField] = column.value;
            }
        });
        //don't add the record if there was a api field mapping error
        if (errorDetected === 0) {
            record.push(device);
        }
        return record;
    },

    processSortQueryString(sortBy) {
        let sort = [];
        var regExpGetSortColumn = /\(([^)]+)\)/;
        var regExpGetSortOrder = /([^)]+)\(/;
        let sortColumn = regExpGetSortColumn.exec(sortBy);
        let sortOrder = regExpGetSortOrder.exec(sortBy);
        if (sortOrder !== null & sortOrder !== null) {
            sort.push({
                column : sortColumn[1],
                order : sortOrder[1]
            });
        }
        return sort;
    },

        /*
      Returns a SAS token for Azure Storage for the specified container. 
      You can also optionally specify a particular blob name and access permissions. 
      To learn more, see https://github.com/Azure-Samples/functions-dotnet-sas-token/blob/master/README.md
    */
    generateSasToken(connString, container, blobName, permissions) {
        //var connString = process.env.AzureWebJobsStorage;
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
        }
    },
    standardizeVersionNumber(sVersion) {
        sVersion = sVersion.replace(new RegExp('^' + 'v'), ''); 
        return sVersion;
    },
    isVersionNewer(reportedVersion, desiredVersion) {

        /*
            05.30.2019 - Updated versioning specs:
            --------------------------------------------------------------
            v0.26.6-0 (CURRENT)
            v0.26.7-0 (REVISION++) 
            v0.27.6-0 (MINOR++)
            v1.00.0-0 (MAJOR++)
        */
        var regex = /^[a-zA-Z](\d+)\.(\d+)\.(\d+)\-(\d+)\-g[0-9a-zA-Z\-]+$/

        reportedVersion = this.validateVersionFormat(reportedVersion);
        desiredVersion = this.validateVersionFormat(desiredVersion);
        
        if (reportedVersion !== null) { 
          reportedVersion = reportedVersion.slice(1);
        }
        if (desiredVersion !== null) {
          desiredVersion = desiredVersion.slice(1);
        }
        if (reportedVersion === null) {
            console.log('reported version failed regex!');
            return false;
        }
        if (desiredVersion === null) {
            console.log('desired version failed regex!');
            return false;
        }
        
        if (reportedVersion.length !== 4) {
            console.log('Could not get expected 4 groups out of reported version')
            return false;
        }
        if (desiredVersion.length !== 4) {
            console.log('Could not get expected 4 groups out of desired version')
            return false;
        }
            
        // compare Major version 
        if (desiredVersion[0] < reportedVersion[0]) {
            console.log('Desired version is older - major component of desired version is older than reported');
            return false;
        }
        if (desiredVersion[0] > reportedVersion[0]) {
            console.log('Desired version is newer - major component of desired version is newer than reported')
            return true;
        }
        
        // compare Minor version
        if (desiredVersion[1] < reportedVersion[1]) {
            console.log('Desired version is older - minor component of desired version is older than reported');
            return false;
        }
        if (desiredVersion[1] > reportedVersion[1]) {
            console.log('Desired version is newer - minor component of desired version is newer than reported')
            return true;
        }
        
        // compare Revision
        if (desiredVersion[2] < reportedVersion[2]) {
            console.log('Desired version is older - revision component of desired version is older than reported');
            return false;
        }
        if (desiredVersion[2] > reportedVersion[2]) {
            console.log('Desired version is newer - revision component of desired version is newer than reported')
            return true;
        }
        
        // compare Sequence
        if (desiredVersion[3] < reportedVersion[3]) {
            console.log('Desired version is older - sequence component of desired version is older than reported');
            return false;
        }
        if (desiredVersion[3] > reportedVersion[3]) {
            console.log('Desired version is newer - sequence component of desired version is newer than reported')
            return true;
        }
        
        // must be the same if we get here
        console.log('Desired version is the same as reported, so not newer')
        return false;

    },
    isIntegerOnly(s) {
        let regex = /^[0-9]+$/
        let matched = regex.exec(s);
        if (matched === null) { return false} else {return true}
    },
    validateVersionFormat(s) {
        let regex = /^[a-zA-Z](\d+)\.(\d+)\.(\d+)\-(\d+)\-g[0-9a-zA-Z\-]+$/
        let matched = regex.exec(s);
        return matched;
    },
    isVersionValidFormat(s) {
        let matched = this.validateVersionFormat(s);
        if (matched === null) { return false} else {return true}
    }
    
 }
