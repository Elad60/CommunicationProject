-- ================================================
-- Stored Procedures for Private Calls Feature
-- Microsoft SQL Server
-- ================================================

-- 1. SP לשליחת הזמנה לשיחה פרטית
CREATE OR ALTER PROCEDURE [dbo].[SP_SendPrivateCallInvitation]
    @CallerId INT,
    @ReceiverId INT,
    @InvitationId NVARCHAR(50) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(500);
    DECLARE @CallerName NVARCHAR(100), @CallerEmail NVARCHAR(100), @CallerRole NVARCHAR(50);
    DECLARE @ReceiverName NVARCHAR(100), @ReceiverEmail NVARCHAR(100), @ReceiverRole NVARCHAR(50);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- בדיקה שהמשתמשים קיימים
        IF NOT EXISTS (SELECT 1 FROM [dbo].[UsersF] WHERE [Id] = @CallerId)
        BEGIN
            SET @ErrorMessage = 'Caller not found';
            THROW 50001, @ErrorMessage, 1;
        END
        
        IF NOT EXISTS (SELECT 1 FROM [dbo].[UsersF] WHERE [Id] = @ReceiverId)
        BEGIN
            SET @ErrorMessage = 'Receiver not found';
            THROW 50002, @ErrorMessage, 1;
        END
        
        -- בדיקה שאין הזמנה פעילה בין המשתמשים
        IF EXISTS (
            SELECT 1 FROM [dbo].[PrivateCallInvitations] 
            WHERE (([CallerId] = @CallerId AND [ReceiverId] = @ReceiverId) 
                   OR ([CallerId] = @ReceiverId AND [ReceiverId] = @CallerId))
                AND [Status] = 'pending'
                AND [ExpiresAt] > GETUTCDATE()
        )
        BEGIN
            SET @ErrorMessage = 'Active invitation already exists between these users';
            THROW 50003, @ErrorMessage, 1;
        END
        
        -- קבלת פרטי המשתמשים
        SELECT @CallerName = [Username], @CallerEmail = [Email], @CallerRole = [Role]
        FROM [dbo].[UsersF] WHERE [Id] = @CallerId;
        
        SELECT @ReceiverName = [Username], @ReceiverEmail = [Email], @ReceiverRole = [Role]
        FROM [dbo].[UsersF] WHERE [Id] = @ReceiverId;
        
        -- יצירת ID ייחודי להזמנה
        SET @InvitationId = 'call_' + 
                           CAST(IIF(@CallerId < @ReceiverId, @CallerId, @ReceiverId) AS NVARCHAR(10)) + '_' +
                           CAST(IIF(@CallerId < @ReceiverId, @ReceiverId, @CallerId) AS NVARCHAR(10)) + '_' +
                           CAST(DATEDIFF(SECOND, '1970-01-01', GETUTCDATE()) AS NVARCHAR(20));
        
        -- הכנסת ההזמנה
        INSERT INTO [dbo].[PrivateCallInvitations] (
            [Id], [CallerId], [ReceiverId], 
            [CallerName], [CallerEmail], [CallerRole],
            [ReceiverName], [ReceiverEmail], [ReceiverRole],
            [Status], [ExpiresAt], [ChannelName]
        )
        VALUES (
            @InvitationId, @CallerId, @ReceiverId,
            @CallerName, @CallerEmail, @CallerRole,
            @ReceiverName, @ReceiverEmail, @ReceiverRole,
            'pending', DATEADD(SECOND, 30, GETUTCDATE()),
            'private_' + CAST(IIF(@CallerId < @ReceiverId, @CallerId, @ReceiverId) AS NVARCHAR(10)) + '_' +
                        CAST(IIF(@CallerId < @ReceiverId, @ReceiverId, @CallerId) AS NVARCHAR(10))
        );
        
        COMMIT TRANSACTION;
        
        SELECT 
            [Id] as InvitationId,
            [ChannelName],
            'Invitation sent successfully' as Message
        FROM [dbo].[PrivateCallInvitations] 
        WHERE [Id] = @InvitationId;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END
GO

-- 2. SP לבדיקת שיחות נכנסות
CREATE OR ALTER PROCEDURE [dbo].[SP_GetIncomingCalls]
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- ניקוי הזמנות שפגו
    UPDATE [dbo].[PrivateCallInvitations]
    SET [Status] = 'timeout', [UpdatedAt] = GETUTCDATE()
    WHERE [Status] = 'pending' AND [ExpiresAt] <= GETUTCDATE();
    
    -- החזרת הזמנות פעילות
    SELECT 
        [Id],
        [CallerId],
        [CallerName],
        [CallerEmail], 
        [CallerRole],
        [ChannelName],
        [CreatedAt] as Timestamp,
        [ExpiresAt],
        [Status]
    FROM [dbo].[PrivateCallInvitations]
    WHERE [ReceiverId] = @UserId 
        AND [Status] = 'pending'
        AND [ExpiresAt] > GETUTCDATE()
    ORDER BY [CreatedAt] ASC;
END
GO

-- 3. SP לקבלת שיחה
CREATE OR ALTER PROCEDURE [dbo].[SP_AcceptCallInvitation]
    @InvitationId NVARCHAR(50),
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(500);
    DECLARE @ChannelName NVARCHAR(100);
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- בדיקה שההזמנה קיימת ופעילה
        IF NOT EXISTS (
            SELECT 1 FROM [dbo].[PrivateCallInvitations] 
            WHERE [Id] = @InvitationId 
                AND [ReceiverId] = @UserId
                AND [Status] = 'pending'
                AND [ExpiresAt] > GETUTCDATE()
        )
        BEGIN
            SET @ErrorMessage = 'Invitation not found or expired';
            THROW 50004, @ErrorMessage, 1;
        END
        
        -- קבלת שם הערוץ
        SELECT @ChannelName = [ChannelName]
        FROM [dbo].[PrivateCallInvitations]
        WHERE [Id] = @InvitationId;
        
        -- עדכון סטטוס ההזמנה
        UPDATE [dbo].[PrivateCallInvitations]
        SET [Status] = 'accepted', [UpdatedAt] = GETUTCDATE()
        WHERE [Id] = @InvitationId;
        
        -- הוספה להיסטוריה
        INSERT INTO [dbo].[PrivateCallHistory] (
            [InvitationId], [CallerId], [ReceiverId], [StartedAt]
        )
        SELECT [Id], [CallerId], [ReceiverId], GETUTCDATE()
        FROM [dbo].[PrivateCallInvitations]
        WHERE [Id] = @InvitationId;
        
        COMMIT TRANSACTION;
        
        SELECT 
            @InvitationId as InvitationId,
            @ChannelName as ChannelName,
            'Call accepted successfully' as Message,
            'accepted' as Status
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END
GO

-- 4. SP לדחיית שיחה
CREATE OR ALTER PROCEDURE [dbo].[SP_RejectCallInvitation]
    @InvitationId NVARCHAR(50),
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(500);
    
    BEGIN TRY
        -- בדיקה שההזמנה קיימת ופעילה
        IF NOT EXISTS (
            SELECT 1 FROM [dbo].[PrivateCallInvitations] 
            WHERE [Id] = @InvitationId 
                AND [ReceiverId] = @UserId
                AND [Status] = 'pending'
        )
        BEGIN
            SET @ErrorMessage = 'Invitation not found or already processed';
            THROW 50005, @ErrorMessage, 1;
        END
        
        -- עדכון סטטוס ההזמנה
        UPDATE [dbo].[PrivateCallInvitations]
        SET [Status] = 'rejected', [UpdatedAt] = GETUTCDATE()
        WHERE [Id] = @InvitationId;
        
        SELECT 
            @InvitationId as InvitationId,
            'Call rejected successfully' as Message,
            'rejected' as Status
        
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- 5. SP לביטול שיחה יוצאת
CREATE OR ALTER PROCEDURE [dbo].[SP_CancelCallInvitation]
    @InvitationId NVARCHAR(50),
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ErrorMessage NVARCHAR(500);
    
    BEGIN TRY
        -- בדיקה שההזמנה קיימת ויוצאת ממשתמש זה
        IF NOT EXISTS (
            SELECT 1 FROM [dbo].[PrivateCallInvitations] 
            WHERE [Id] = @InvitationId 
                AND [CallerId] = @UserId
                AND [Status] = 'pending'
        )
        BEGIN
            SET @ErrorMessage = 'Invitation not found or cannot be cancelled';
            THROW 50006, @ErrorMessage, 1;
        END
        
        -- עדכון סטטוס ההזמנה
        UPDATE [dbo].[PrivateCallInvitations]
        SET [Status] = 'cancelled', [UpdatedAt] = GETUTCDATE()
        WHERE [Id] = @InvitationId;
        
        SELECT 
            @InvitationId as InvitationId,
            'Call cancelled successfully' as Message,
            'cancelled' as Status
        
    END TRY
    BEGIN CATCH
        THROW;
    END CATCH
END
GO

-- 6. SP לבדיקת סטטוס שיחה
CREATE OR ALTER PROCEDURE [dbo].[SP_GetCallStatus]
    @InvitationId NVARCHAR(50),
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- ניקוי הזמנות שפגו לפני בדיקה
    UPDATE [dbo].[PrivateCallInvitations]
    SET [Status] = 'timeout', [UpdatedAt] = GETUTCDATE()
    WHERE [Id] = @InvitationId 
        AND [Status] = 'pending' 
        AND [ExpiresAt] <= GETUTCDATE();
    
    -- החזרת סטטוס ההזמנה
    SELECT 
        [Id] as InvitationId,
        [Status],
        [ChannelName],
        [CreatedAt] as Timestamp,
        [UpdatedAt],
        [ExpiresAt],
        CASE 
            WHEN [CallerId] = @UserId THEN 'outgoing'
            WHEN [ReceiverId] = @UserId THEN 'incoming'
            ELSE 'unknown'
        END as Direction
    FROM [dbo].[PrivateCallInvitations]
    WHERE [Id] = @InvitationId 
        AND ([CallerId] = @UserId OR [ReceiverId] = @UserId);
END
GO

-- 7. SP לסיום שיחה והוספה להיסטוריה
CREATE OR ALTER PROCEDURE [dbo].[SP_EndPrivateCall]
    @InvitationId NVARCHAR(50),
    @EndReason NVARCHAR(50) = 'completed'
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- עדכון זמן סיום בהיסטוריה
        UPDATE [dbo].[PrivateCallHistory]
        SET [EndedAt] = GETUTCDATE(),
            [DurationSeconds] = DATEDIFF(SECOND, [StartedAt], GETUTCDATE()),
            [EndReason] = @EndReason
        WHERE [InvitationId] = @InvitationId
            AND [EndedAt] IS NULL;
        
        -- עדכון סטטוס ההזמנה
        UPDATE [dbo].[PrivateCallInvitations]
        SET [Status] = 'completed', [UpdatedAt] = GETUTCDATE()
        WHERE [Id] = @InvitationId;
        
        COMMIT TRANSACTION;
        
        SELECT 
            @InvitationId as InvitationId,
            'Call ended successfully' as Message,
            @EndReason as EndReason
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END
GO

-- 8. SP לניקוי הזמנות ישנות (לhousekeeping job)
CREATE OR ALTER PROCEDURE [dbo].[SP_CleanupOldInvitations]
    @DaysToKeep INT = 7
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CutoffDate DATETIME2 = DATEADD(DAY, -@DaysToKeep, GETUTCDATE());
    DECLARE @DeletedCount INT;
    
    -- מחיקת הזמנות ישנות
    DELETE FROM [dbo].[PrivateCallInvitations]
    WHERE [CreatedAt] < @CutoffDate
        AND [Status] IN ('rejected', 'timeout', 'cancelled', 'completed');
    
    SET @DeletedCount = @@ROWCOUNT;
    
    SELECT 
        @DeletedCount as DeletedInvitations,
        @CutoffDate as CutoffDate,
        'Cleanup completed successfully' as Message;
END
GO

-- 9. SP לקבלת סטטיסטיקות משתמש
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
GO

PRINT 'Private Calls stored procedures created successfully!'; 