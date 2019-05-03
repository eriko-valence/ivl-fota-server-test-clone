CREATE PROCEDURE [dbo].[uspUpdateGroup]
  @groupid int, @name nchar(100), @desiredfwid nchar(100)
AS
BEGIN
  
  IF @desiredfwid IS NOT NULL
  BEGIN
	  UPDATE DeviceGroup
	  Set 
		Name = @name,
		DesiredFirmwareId = @desiredfwid
	  WHERE
		Id = @groupid;
  END
  ELSE
  BEGIN
  	  UPDATE DeviceGroup
	  Set 
		Name = @name
	  WHERE
		Id = @groupid;
  END

  SELECT * FROM vwGroup where GroupId = @groupid;
		
END