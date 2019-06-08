CREATE PROCEDURE [dbo].[uspCreateFirmware]
  @version nchar(100), @signature nchar(1000), @md5 nchar(100), @blobname nchar(100), @blobcontainer nchar(100), @result INT OUTPUT
AS
BEGIN
	BEGIN TRY
		BEGIN TRANSACTION
			IF EXISTS(SELECT 1 FROM vwFirmware WHERE [Version] = @version)
			  SET @result = 6 --firmware already exists in database
			ELSE
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
		COMMIT
	END TRY
	BEGIN CATCH
		SET @result = 4 --unsuccessful creation
		ROLLBACK
	END CATCH	


END