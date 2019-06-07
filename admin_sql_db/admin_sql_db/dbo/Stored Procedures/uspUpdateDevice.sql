CREATE PROCEDURE [dbo].[uspUpdateDevice]
  @deviceid bigint, @groupid nchar(100), @result INT OUTPUT
AS
BEGIN
	BEGIN TRY
		BEGIN TRANSACTION
			IF EXISTS(SELECT 1 FROM vwDevice WHERE DeviceId = @deviceid)
			BEGIN
				IF EXISTS(SELECT 1 FROM vwGroup WHERE GroupId = @groupid)
				BEGIN
					UPDATE Device
					SET DeviceGroupId = @groupid 
					WHERE
					Id = @deviceid;

					IF @@rowcount = 1
						SET @result = 1 --successful update
					ELSE
						SET @result = 4 --unsuccessful update 
					SELECT * FROM vwDevice where DeviceId = @deviceid;
				END
				ELSE
					SET @result = 5 --group not found
			END
			ELSE
				SET @result = 2 --device not found
		COMMIT
	END TRY
	BEGIN CATCH
		SET @result = 4 --unsuccessful update
		ROLLBACK
	END CATCH	
END