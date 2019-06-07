CREATE PROCEDURE [dbo].[uspUpdateGroup]
  @groupid int, @name nchar(100), @desiredfwid nchar(100), @result INT OUTPUT
AS
BEGIN
	BEGIN TRY
		BEGIN TRANSACTION
			IF EXISTS(SELECT 1 FROM vwGroup WHERE GroupId = @groupid)
			BEGIN
				IF @desiredfwid IS NOT NULL
				BEGIN
					IF EXISTS(SELECT 1 FROM vwFirmware WHERE FirmwareId = @desiredfwid)
					BEGIN
					UPDATE DeviceGroup
					Set 
					Name = @name,
					DesiredFirmwareId = @desiredfwid
					WHERE
					Id = @groupid;

					IF @@rowcount = 1
					SET @result = 1 --successful update
					ELSE
					SET @result = 4 --unsuccessful update 
					END
					ELSE
					  SET @result = 5 --firmware does not exist 
				END
				ELSE
				BEGIN
  					UPDATE DeviceGroup
					Set 
					Name = @name
					WHERE
					Id = @groupid;

					IF @@rowcount = 1
					SET @result = 1 --successful update
					ELSE
					SET @result = 4 --unsuccessful update 
				END
				SELECT * FROM vwGroup where GroupId = @groupid;
			END
			ELSE
				SET @result = 2 --group not found
			COMMIT
	END TRY
	BEGIN CATCH
		SET @result = 4 --unsuccessful update
		ROLLBACK
	END CATCH
END