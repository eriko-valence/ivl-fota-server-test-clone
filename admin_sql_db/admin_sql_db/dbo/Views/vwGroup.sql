CREATE VIEW [vwGroup] AS
SELECT 
  RTRIM(t1.Id) as 'GroupId',
  RTRIM(t1.Name) as 'GroupName',
  RTRIM(t2.Version) as 'DesiredFirmwareVersion'
FROM
  DeviceGroup t1
LEFT OUTER JOIN
  DeviceFirmware t2 ON t2.Id = t1.DesiredFirmwareId;