CREATE PROCEDURE [dbo].[uspCreateGroup]
  @name nchar(100), @desiredfwid nchar(100)
AS
BEGIN
  
  INSERT INTO DeviceGroup([Name], DesiredFirmwareId) 
	VALUES(
		@name,
		@desiredfwid);

  SELECT * FROM vwGroup where GroupName = @name; --TODO: May want to change the where clause from Name to Id
		
END