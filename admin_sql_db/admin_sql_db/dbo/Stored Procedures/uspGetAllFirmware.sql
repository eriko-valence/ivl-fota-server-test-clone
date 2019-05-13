CREATE PROCEDURE [dbo].[uspGetAllFirmware]
AS
BEGIN
  --select * from vwFirmware
  --TODO: Substring just for temp dev purposes - replace substring with a 'copy link' feature in web app
  select Id as 'FirmwareId', Version, (SUBSTRING(Signature, 0, 25) + '...') as Signature, Md5, BlobName, BlobContainer from DeviceFirmware

END