CREATE PROCEDURE [dbo].[uspCreateFirmware]
  @version nchar(100), @signature nchar(1000), @md5 nchar(100), @blobname nchar(100), @blobcontainer nchar(100), @result INT OUTPUT
AS
BEGIN
  
  INSERT INTO DeviceFirmware([Version], [Signature], [Md5], [BlobName], [BlobContainer] ) 
	VALUES(
		@version,
		@signature,
		@md5,
		@blobname,
		@blobcontainer);

  IF @@rowcount = 1
    SET @result = 1 --successful creation
  ELSE
	SET @result = 4 --unsuccessful creation 

  SELECT * FROM vwFirmware where BlobName = @blobname;
		
END