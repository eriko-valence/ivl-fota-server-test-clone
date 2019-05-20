/*
Deletes existing firmware from MFOX DB.  The following requirements apply to firmware delete:
  - Only firmware not attached to device groups can be deleted.
*/

CREATE PROCEDURE [dbo].[uspDeleteFirmware]
  @firmwareid int, @result INT OUTPUT
AS
BEGIN
	BEGIN TRY
		BEGIN TRANSACTION
			DECLARE @groupcount INT, @fwexists INT
			--Only firmware not attached to device groups can be deleted.
			SET @groupcount = (SELECT count(*) FROM DeviceGroup WHERE DesiredFirmwareId = @firmwareid);

			SET @fwexists = (SELECT count(*) FROM DeviceFirmware WHERE Id = @firmwareid);

			IF @fwexists = 0
				SET @result = 2; --Firmware does not exist
			ELSE IF @groupcount > 0
				SET @result = 3; --Only firmware not currently assigned to any groups can be deleted.
			ELSE
				BEGIN
				DELETE FROM DeviceFirmware WHERE Id = @firmwareid;
					IF @@rowcount = 1
					  SET @result = 1 --successful deletion
					else
					  SET @result = 4 --firmware not deleted 
				END
			COMMIT
	END TRY
	BEGIN CATCH
		SET @result = 4 --unsuccessful update
		ROLLBACK
	END CATCH
END