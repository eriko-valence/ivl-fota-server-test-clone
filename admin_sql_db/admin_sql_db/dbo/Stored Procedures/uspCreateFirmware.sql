﻿CREATE PROCEDURE [dbo].[uspCreateFirmware]
  @version nchar(100), @signature nchar(1000), @md5 nchar(100), @blobname nchar(100), @blobcontainer nchar(100)
AS
BEGIN
  
  INSERT INTO DeviceFirmware([Version], [Signature], [Md5], [BlobName], [BlobContainer] ) 
	VALUES(
		@version,
		@signature,
		@md5,
		@blobname,
		@blobcontainer);

  SELECT * FROM vwFirmware where BlobName = @blobname; --TODO: May want to change the where clause from BlobName to Id
		
END