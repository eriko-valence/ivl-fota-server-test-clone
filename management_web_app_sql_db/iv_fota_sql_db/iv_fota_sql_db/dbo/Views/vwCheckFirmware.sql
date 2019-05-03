/*
* - Get the group the device is in, 
* - Look at the desired firmware for that group, then
* - Get that firmware
*/

CREATE VIEW [vwCheckFirmware] AS
SELECT 
  RTRIM(t1.Id) as 'DeviceId', 
  RTRIM(t3.Version) as 'DesiredVersion', 
  RTRIM(t3.Signature) as 'Signature', 
  RTRIM(t3.Md5) as 'Md5', 
  RTRIM(t3.BlobName) as BlobName, 
  RTRIM(t3.BlobContainer) as 'BlobContainer'
FROM
  Device t1
LEFT OUTER JOIN 
  DeviceGroup t2 ON t2.Id = t1.DeviceGroupId
LEFT OUTER JOIN 
  DeviceFirmware t3 ON t3.Id = t2.DesiredFirmwareId;