﻿CREATE PROCEDURE [dbo].[uspUpdateGroup]
  @groupid int, @name nchar(100), @desiredfwid nchar(100), @result INT OUTPUT
AS
BEGIN
  
if exists(Select 1 From vwGroup where GroupId = @groupid)
BEGIN

  IF @desiredfwid IS NOT NULL
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


		
END