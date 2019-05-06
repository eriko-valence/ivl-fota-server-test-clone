
CREATE VIEW [vwFirmware] AS
SELECT 
  RTRIM(t1.Id) as 'FirmwareId', 
  RTRIM(t1.Version) as 'Version', 
  RTRIM(t1.Signature) as 'Signature', 
  RTRIM(t1.Md5) as 'Md5',
  RTRIM(t1.BlobName) as 'BlobName', 
  RTRIM(t1.BlobContainer) as 'BlobContainer'
FROM
  DeviceFirmware t1