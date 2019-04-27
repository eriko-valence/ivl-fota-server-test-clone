var Connection = require('tedious').Connection;
var Request = require('tedious').Request;

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

        request = new Request("SELECT Version, Signature, RTRIM(Uri) as Uri, Md5 from FirmwareManifest", function(err) {
        if (err) {
            console.log(err);}
        });

        let firmware = {};

        //TODO - Handle more than one row in the result set
        request.on('row', function(columns) {
            columns.forEach(function(column) {
                firmware[column.metadata.colName] = column.value;
            });
            context.res = {
                status: 200,
                body: firmware
            };
            context.done();
            
        });

        //request.on('requestCompleted', function () {
        //    cleanUp();
        //});
        connection.execSql(request);
    }

    function cleanUp() {
        //context.done();
    }

}
