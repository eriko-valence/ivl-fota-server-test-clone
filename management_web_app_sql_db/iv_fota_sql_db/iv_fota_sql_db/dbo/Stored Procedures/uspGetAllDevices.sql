CREATE PROCEDURE [dbo].[uspGetAllDevices]
AS
BEGIN
  select * from vwDevice
END