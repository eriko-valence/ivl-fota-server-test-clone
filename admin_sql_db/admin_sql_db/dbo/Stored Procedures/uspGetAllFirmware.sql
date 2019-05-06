CREATE PROCEDURE [dbo].[uspGetAllFirmware]
AS
BEGIN
  select * from vwFirmware
END