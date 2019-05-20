CREATE PROCEDURE [dbo].[uspGetAllFirmware]
AS
BEGIN
  select 
    Id as 'FirmwareId', 
	TRIM(Version) as 'Version', 
	TRIM(Signature) as 'Signature', 
	TRIM(Md5) as 'Md5', 
	TRIM(BlobName) as 'BlobName', 
	TRIM(BlobContainer) as 'BlobContainer' 
  from DeviceFirmware

END