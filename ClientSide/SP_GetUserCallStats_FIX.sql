-- תיקון עבור SP_GetUserCallStats
CREATE OR ALTER PROCEDURE [dbo].[SP_GetUserCallStats]
    @UserId INT,
    @DaysBack INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StartDate DATETIME2 = DATEADD(DAY, -@DaysBack, GETUTCDATE());
    
    SELECT 
        @UserId as UserId,
        (SELECT Username FROM [dbo].[UsersF] WHERE Id = @UserId) as Username,
        COUNT(CASE WHEN pci.[CallerId] = @UserId THEN 1 END) as CallsMade,
        COUNT(CASE WHEN pci.[ReceiverId] = @UserId THEN 1 END) as CallsReceived,
        COUNT(CASE WHEN pci.[CallerId] = @UserId AND pci.[Status] = 'accepted' THEN 1 END) as CallsAccepted,
        COUNT(CASE WHEN pci.[ReceiverId] = @UserId AND pci.[Status] = 'rejected' THEN 1 END) as CallsRejected,
        COUNT(CASE WHEN pci.[Status] = 'timeout' THEN 1 END) as CallsTimedOut,
        AVG(CASE WHEN h.[DurationSeconds] IS NOT NULL THEN h.[DurationSeconds] END) as AvgCallDurationSeconds
    FROM [dbo].[PrivateCallInvitations] pci
    LEFT JOIN [dbo].[PrivateCallHistory] h ON pci.[Id] = h.[InvitationId]
    WHERE (pci.[CallerId] = @UserId OR pci.[ReceiverId] = @UserId)
        AND pci.[CreatedAt] >= @StartDate;
END

PRINT 'SP_GetUserCallStats fixed successfully!'; 