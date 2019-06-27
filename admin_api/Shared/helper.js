var _ = require('lodash');
var azure = require('azure-storage');

module.exports = {
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
                if (column.value === null) {
                    device[apiField] = '';
                } else {
                    device[apiField] = column.value;
                }
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
    validateObjectsHaveSamePropertyNames(a, b) {
        var aProps = Object.getOwnPropertyNames(a);
        var bProps = Object.getOwnPropertyNames(b);
        return _.isEqual(aProps.sort(), bProps.sort())
    },
    getAzureBlobUri(blobContainer, blobName) {
        let azureBlobEndpoint = process.env.AzureBlobEndpoint;
        return `${azureBlobEndpoint}${blobContainer}/${blobName}`;
    },
    /*
      Returns a SAS token for Azure Storage for the specified container. 
      You can also optionally specify a particular blob name and access permissions. 
      To learn more, see https://github.com/Azure-Samples/functions-dotnet-sas-token/blob/master/README.md
    */
   generateSasToken(connString, container, blobName, permissions) {
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
    isIntegerOnly(s) {
        let regex = /^[0-9]+$/
        let matched = regex.exec(s);
        if (matched === null) { return false} else {return true}
    }
 }
