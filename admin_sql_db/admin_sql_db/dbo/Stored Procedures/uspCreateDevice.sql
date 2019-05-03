CREATE PROCEDURE [dbo].[uspCreateDevice]
  @deviceid bigint, @groupid nchar(100)
AS
BEGIN
  
  INSERT INTO Device(Id, DeviceGroupId) 
	VALUES(
		@deviceid,
		@groupid);

  SELECT * FROM vwDevice where DeviceId = @deviceid;
		
END