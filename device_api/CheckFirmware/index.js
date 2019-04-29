var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var azure = require('azure-storage');

module.exports = function (context, req) {

    var config =
    {
        authentication: {
            options: {
                userName: process.env.AzureSqlServerLoginName,
                password: process.env.AzureSqlServerLoginPass
            },
            type: 'default'
        },
        server: process.env.AzureSqlServerName,
        options:
        {
            database: process.env.AzureSqlDatabaseName,
            encrypt: true
        }
    }

    var connection = new Connection(config);
    connection.on('connect', function(err) {
        getFirmwareManifest();
    });

    function getFirmwareManifest() {

        let deviceid = req.params['deviceid'];
        let reportedVersion = req.query['ver'];
        let sqlQuery = `SELECT * from vwCheckFirmware where DeviceId = '${deviceid}' AND DesiredVersion > '${reportedVersion}'`;

        request = new Request(sqlQuery, function(err) {
        if (err) {
            console.log(err);}
        });

        let desiredFirmware = {};

        request.on('row', function(columns) {
            columns.forEach(function(column) {
                desiredFirmware[column.metadata.colName] = column.value;
            });
        });

        request.on('requestCompleted', function () {
            let sasToken = generateSasToken(desiredFirmware['BlobContainer'], desiredFirmware['BlobName'], null);
            context.res = {
                status: 200,
                body: {
                    version: desiredFirmware['DesiredVersion'],
                    signature: desiredFirmware['Signature'],
                    uri: sasToken.uri,
                    md5: desiredFirmware['Md5']
                }
            };
            context.done();

        });
        connection.execSql(request);
    }

    /*
      Returns a SAS token for Azure Storage for the specified container. 
      You can also optionally specify a particular blob name and access permissions. 
      To learn more, see https://github.com/Azure-Samples/functions-dotnet-sas-token/blob/master/README.md
    */
   function generateSasToken(container, blobName, permissions) {
    var connString = process.env.AzureWebJobsStorage;
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
    };
}

}
