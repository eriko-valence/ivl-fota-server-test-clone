
CREATE VIEW [vwFirmware] AS
SELECT 
  RTRIM(t1.Id) as 'FirmwareId', 
  TRIM(t1.Version) as 'Version', 
  TRIM(t1.Signature) as 'Signature', 
  TRIM(t1.Md5) as 'Md5',
  TRIM(t1.BlobName) as 'BlobName', 
  TRIM(t1.BlobContainer) as 'BlobContainer'
FROM
  DeviceFirmware t1