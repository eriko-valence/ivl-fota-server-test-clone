/*
    Mappings for sql column names to api response payload fields
    
        Template: {sql column name}: {api field name}
*/

module.exports = {
    getDeviceApiFieldMappings: function() {
        return {
            DeviceId: 'deviceid',
            GroupName: 'group',
            GroupId: 'group_id',
            DesiredFirmwareVersion: 'desired_fw',
            ReportedFirmwareVersion: 'reported_fw',
            LastReported: 'last_reported'
        };
    },
    
    getGroupApiFieldMappings: function() {
        return {
            GroupId: 'group_id',
            GroupName: 'name',
            DesiredFirmwareVersion: 'desired_fw',
            FirmwareId: 'firmware_id'
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
