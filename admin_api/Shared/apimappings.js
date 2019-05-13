/*
    Mappings for sql column names to api response payload fields
    
        Template: {sql column name}: {api field name}
*/

module.exports = {
    getDeviceApiFieldMappings: function() {
        return {
            DeviceId: 'deviceid',
            GroupName: 'group',
            DesiredFirmwareVersion: 'desired_fw',
            ReportedFirmwareVersion: 'reported_fw'
        };
    },
    
    getGroupApiFieldMappings: function() {
        return {
            GroupId: 'group_id',
            GroupName: 'name',
            DesiredFirmwareVersion: 'desired_fw'
        };
    },

    getFirmwareApiFieldMappings: function() {
        return {
            FirmwareId: 'firmware_id',
            Version: 'version',
            Signature: 'signature',
            Md5: 'md5',
            BlobName: 'blob_name',
            BlobContainer: 'blob_container'
        };
    }
 }
