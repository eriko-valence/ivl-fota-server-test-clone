module.exports = {
    getFirmwareManifestFieldMappings: function() {
        return {
            DeviceId: 'deviceid',
            DesiredVersion: 'version',
            Signature: 'signature',
            Md5: 'md5',
            BlobContainer: 'blob_container',
            BlobName: 'blob_name',
        };
    }
 }
