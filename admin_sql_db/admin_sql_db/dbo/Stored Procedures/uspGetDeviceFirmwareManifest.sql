CREATE PROCEDURE [dbo].[uspGetDeviceFirmwareManifest]
  @deviceid bigint
AS
BEGIN
  select * from vwCheckFirmware where DeviceId = @deviceid
END