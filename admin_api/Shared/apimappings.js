/*
    Mappings for sql column names to api response payload fields
    
        Template: {sql column name}: {api field name}
*/

module.exports = {
    getDeviceApiFieldMappings: function() {
        return {
            DeviceId: 'deviceid',
            GroupName: 'group',
            DesiredFirmwareVersion: 'desired_fw'
        };
    },
    
    getGroupApiFieldMappings: function() {
        return {
            GroupName: 'group',
            DesiredFirmwareVersion: 'desired_fw'
        };
    }
 }
