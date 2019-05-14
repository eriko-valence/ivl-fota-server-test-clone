CREATE VIEW [vwGroup] AS
SELECT 
  RTRIM(t1.Id) as 'GroupId',
  TRIM(t1.Name) as 'GroupName',
  TRIM(t2.Version) as 'DesiredFirmwareVersion',
  RTRIM(t2.Id) as 'FirmwareId'
FROM
  DeviceGroup t1
LEFT OUTER JOIN
  DeviceFirmware t2 ON t2.Id = t1.DesiredFirmwareId;