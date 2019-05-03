CREATE PROCEDURE [dbo].[uspCreateDevice]
  @deviceid bigint, @group nchar(100), @result INT OUTPUT
AS
BEGIN
  
  INSERT INTO Device(Id, DeviceGroupId) 
	VALUES(
		@deviceid,
		@group);

  SET @result = @@ROWCOUNT;

  RETURN @result;
		
END