const helper = require('../Shared/helper');
var _ = require('lodash');

module.exports = function (context, req) {

    let name = _.get(req.query, 'name', null); //pull deviceid from route parameter
    if (name !== null) {
        name = `${process.env.AzureBlobNamePrefix}${name}`;
    }

    // The following values can be used for permissions: 
    // "a" (Add), "r" (Read), "w" (Write), "d" (Delete), "l" (List)
    // Concatenate multiple permissions, such as "rwa" = Read, Write, Add
    let sasToken = helper.generateSasToken(process.env.AzureBlobContainer, name, "racwl");

    let bodySasUri = {sas_uri: sasToken.uri};

    context.res = {
        status: 200,
        body: bodySasUri
    };
    context.done(); 

};