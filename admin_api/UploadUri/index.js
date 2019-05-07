const helper = require('../Shared/helper');

module.exports = function (context, req) {
    context.log('JavaScript HTTP trigger function processed a request.');

    // The following values can be used for permissions: 
    // "a" (Add), "r" (Read), "w" (Write), "d" (Delete), "l" (List)
    // Concatenate multiple permissions, such as "rwa" = Read, Write, Add
    let sasToken = helper.generateSasToken("fota", "bin/test12345.txt", "rwa");

    let bodySasUri = {sas_uri: sasToken.uri};

    context.res = {
        status: 200,
        body: bodySasUri
    };
    context.done(); 

};