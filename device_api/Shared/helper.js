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
