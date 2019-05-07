const helper = require('../Shared/helper');
var _ = require('lodash');

module.exports = function (context, req) {

    let name = _.get(req.query, 'name', ''); //pull deviceid from route parameter
    console.log('name: ' + name);
    console.log(req);

    // The following values can be used for permissions: 
    // "a" (Add), "r" (Read), "w" (Write), "d" (Delete), "l" (List)
    // Concatenate multiple permissions, such as "rwa" = Read, Write, Add
    let sasToken = helper.generateSasToken("fota", name, "rwa");

    let bodySasUri = {sas_uri: sasToken.uri};

    context.res = {
        status: 200,
        body: bodySasUri
    };
    context.done(); 

};