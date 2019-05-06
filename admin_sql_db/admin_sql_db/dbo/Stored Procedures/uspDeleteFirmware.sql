/*
Deletes existing firmware from MFOX DB.  The following requirements apply to firmware delete:
  - Only firmware not attached to device groups can be deleted.
*/

CREATE PROCEDURE [dbo].[uspDeleteFirmware]
  @firmwareid int, @result INT OUTPUT
AS
BEGIN
 
 DECLARE @groupcount INT, @fwexists INT

--Only firmware not attached to device groups can be deleted.
SET @groupcount = (select count(*) from DeviceGroup where DesiredFirmwareId = @firmwareid);

SET @fwexists = (select count(*) from DeviceFirmware where Id = @firmwareid);

IF @fwexists = 0
    SET @result = 2; --Firmware does not exist
ELSE IF @groupcount > 0
	SET @result = 3; --Only firmware not currently assigned to any groups can be deleted.
ELSE
	BEGIN
	delete from DeviceFirmware where Id = @firmwareid;
		if @@rowcount = 1
		  SET @result = 1 --successful deletion
		else
		  SET @result = 4 --firmware not deleted 
	END
END