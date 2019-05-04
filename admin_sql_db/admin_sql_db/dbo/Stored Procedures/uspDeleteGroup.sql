/*

Deletes existing group from MFOX DB.  The following requirements apply to group delete:

Only groups not currently assigned to any devices can be deleted.
Restrictions around deleting a group will be handled at the DB level using stored procedures.

*/

CREATE PROCEDURE [dbo].[uspDeleteGroup]
  @groupid int, @result INT OUTPUT
AS
BEGIN
 
 DECLARE @devicecount INT, @groupexists INT

SET @devicecount = (select count(*) from Device where DeviceGroupId = @groupid);

SET @groupexists = (select count(*) from DeviceGroup where Id = @groupid);

IF @groupexists = 0
    SET @result = 2; --Group does not exist
ELSE IF @devicecount > 0
	SET @result = 3; --Only groups not currently assigned to any devices can be deleted.
ELSE
	BEGIN
	delete from DeviceGroup where Id = @groupid;
		if @@rowcount = 1
		  SET @result = 1 --successful deletion
		else
		  SET @result = 4 --group not deleted 
	END
END