CREATE PROCEDURE [dbo].[uspUpdateDevice]
  @deviceid bigint, @groupid nchar(100)
AS
BEGIN
  
  UPDATE Device
  Set DeviceGroupId = @groupid 
  WHERE
  Id = @deviceid;

  SELECT * FROM vwDevice where DeviceId = @deviceid;
		
END