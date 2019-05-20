CREATE PROCEDURE [dbo].[uspCreateGroup]
  @name nchar(100), @desiredfwid nchar(100), @result INT OUTPUT
AS
BEGIN
  
  INSERT INTO DeviceGroup([Name], DesiredFirmwareId) 
	VALUES(
		@name,
		@desiredfwid);

  	IF @@rowcount = 1
	  SET @result = 1 --successful creation
	ELSE
	  SET @result = 4 --unsuccessful creation 

  SELECT * FROM vwGroup where GroupName = @name;
		
END