CREATE PROCEDURE [dbo].[uspGetAllFirmware]
AS
BEGIN
  --select * from vwFirmware
  --TODO: Substring just for temp dev purposes - replace substring with a 'copy link' feature in web app
  select Id as 'FirmwareId', TRIM(Version) as 'Version', (SUBSTRING(Signature, 0, 25) + '...') as Signature, TRIM(Md5) as 'Md5', TRIM(BlobName) as 'BlobName', TRIM(BlobContainer) as 'BlobContainer' from DeviceFirmware

END