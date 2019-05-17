CREATE PROCEDURE [dbo].[uspUpdateDevice]
  @deviceid bigint, @groupid nchar(100), @result INT OUTPUT
AS
BEGIN

if exists(Select 1 From vwDevice where DeviceId = @deviceid)
BEGIN

  UPDATE Device
  Set DeviceGroupId = @groupid 
  WHERE
  Id = @deviceid;

  IF @@rowcount = 1
    SET @result = 1 --successful update
  ELSE
    SET @result = 4 --unsuccessful update 

  SELECT * FROM vwDevice where DeviceId = @deviceid;

END

SET @result = 2 --device not found
  
		
END