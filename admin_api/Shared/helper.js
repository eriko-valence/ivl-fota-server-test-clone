var _ = require('lodash');

module.exports = {
    getConfig: function(login, pass) {
        return {
            authentication: {
                options: {
                    userName: login,
                    password: pass
                },
                type: 'default'
            },
            server: process.env.AzureSqlServerName,
            options:
            {
                database: process.env.AzureSqlDatabaseName,
                encrypt: true
            }
        };
    },

    processRow: function(columns, apiFieldMappings) {
        console.log('process row');
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
    }
 }
