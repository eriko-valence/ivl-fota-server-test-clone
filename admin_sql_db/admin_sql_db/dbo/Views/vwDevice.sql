/*
* - List all devices
* - TODO - can a device ever exist without a device group? 
         - if yes, should this query return these unassigned devices? 
		 - if yes, then need a left outer join
*/

CREATE VIEW [vwDevice] AS
SELECT 
  RTRIM(t1.Id) as 'DeviceId',
  RTRIM(t2.Name) as 'GroupName',
  RTRIM(t3.Version) as 'DesiredFirmwareVersion'
FROM
  Device t1
LEFT OUTER JOIN 
  DeviceGroup t2 ON t2.Id = t1.DeviceGroupId
LEFT OUTER JOIN 
  DeviceFirmware t3 ON t3.Id = t2.DesiredFirmwareId;