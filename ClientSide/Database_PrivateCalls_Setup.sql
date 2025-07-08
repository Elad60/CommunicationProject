-- ================================================
-- Database Setup for Private Calls Feature
-- Microsoft SQL Server
-- ================================================

-- 1. יצירת טבלת הזמנות לשיחות פרטיות
CREATE TABLE [dbo].[PrivateCallInvitations] (
    [Id] NVARCHAR(50) NOT NULL PRIMARY KEY,
    [CallerId] INT NOT NULL,
    [ReceiverId] INT NOT NULL,
    [CallerName] NVARCHAR(100) NOT NULL,
    [CallerEmail] NVARCHAR(100) NOT NULL,
    [CallerRole] NVARCHAR(50) NOT NULL,
    [ReceiverName] NVARCHAR(100) NOT NULL,
    [ReceiverEmail] NVARCHAR(100) NOT NULL,
    [ReceiverRole] NVARCHAR(50) NOT NULL,
    [Status] NVARCHAR(20) NOT NULL DEFAULT 'pending',
    [ChannelName] NVARCHAR(100) NULL,
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    [ExpiresAt] DATETIME2 NOT NULL,
    
    -- Foreign Keys (assuming you have a UserF table)
    CONSTRAINT [FK_PrivateCallInvitations_Caller] 
        FOREIGN KEY ([CallerId]) REFERENCES [dbo].[UserF]([Id]),
    CONSTRAINT [FK_PrivateCallInvitations_Receiver] 
        FOREIGN KEY ([ReceiverId]) REFERENCES [dbo].[UserF]([Id]),
    
    -- Constraints
    CONSTRAINT [CK_PrivateCallInvitations_Status] 
        CHECK ([Status] IN ('pending', 'accepted', 'rejected', 'timeout', 'cancelled')),
    CONSTRAINT [CK_PrivateCallInvitations_NotSameUser] 
        CHECK ([CallerId] != [ReceiverId])
);

-- יצירת אינדקסים לביצועים טובים
CREATE INDEX [IX_PrivateCallInvitations_Caller] 
    ON [dbo].[PrivateCallInvitations] ([CallerId]);

CREATE INDEX [IX_PrivateCallInvitations_Receiver] 
    ON [dbo].[PrivateCallInvitations] ([ReceiverId]);

CREATE INDEX [IX_PrivateCallInvitations_Status] 
    ON [dbo].[PrivateCallInvitations] ([Status]);

CREATE INDEX [IX_PrivateCallInvitations_CreatedAt] 
    ON [dbo].[PrivateCallInvitations] ([CreatedAt]);

CREATE INDEX [IX_PrivateCallInvitations_ExpiresAt] 
    ON [dbo].[PrivateCallInvitations] ([ExpiresAt]);

-- אינדקס מורכב לבדיקת הזמנות פעילות
CREATE INDEX [IX_PrivateCallInvitations_Active] 
    ON [dbo].[PrivateCallInvitations] ([CallerId], [ReceiverId], [Status]) 
    WHERE [Status] = 'pending';

-- 2. יצירת טבלת היסטוריית שיחות (אופציונלי)
CREATE TABLE [dbo].[PrivateCallHistory] (
    [Id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [InvitationId] NVARCHAR(50) NOT NULL,
    [CallerId] INT NOT NULL,
    [ReceiverId] INT NOT NULL,
    [StartedAt] DATETIME2 NULL,
    [EndedAt] DATETIME2 NULL,
    [DurationSeconds] INT NULL,
    [EndReason] NVARCHAR(50) NULL, -- 'completed', 'cancelled', 'failed'
    [CreatedAt] DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    
    CONSTRAINT [FK_PrivateCallHistory_Invitation] 
        FOREIGN KEY ([InvitationId]) REFERENCES [dbo].[PrivateCallInvitations]([Id])
);

-- אינדקס להיסטוריה
CREATE INDEX [IX_PrivateCallHistory_CallerId] 
    ON [dbo].[PrivateCallHistory] ([CallerId]);

CREATE INDEX [IX_PrivateCallHistory_ReceiverId] 
    ON [dbo].[PrivateCallHistory] ([ReceiverId]);

CREATE INDEX [IX_PrivateCallHistory_StartedAt] 
    ON [dbo].[PrivateCallHistory] ([StartedAt]);

-- 3. Trigger לעדכון UpdatedAt אוטומטי
GO
CREATE TRIGGER [dbo].[TR_PrivateCallInvitations_UpdatedAt]
    ON [dbo].[PrivateCallInvitations]
    AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE [dbo].[PrivateCallInvitations]
    SET [UpdatedAt] = GETUTCDATE()
    WHERE [Id] IN (SELECT [Id] FROM inserted);
END;

-- 4. יצירת view לסטטיסטיקות
GO
CREATE VIEW [dbo].[VW_PrivateCallStats] AS
SELECT 
    u.Id as UserId,
    u.Username,
    COUNT(CASE WHEN pci.CallerId = u.Id THEN 1 END) as CallsMade,
    COUNT(CASE WHEN pci.ReceiverId = u.Id THEN 1 END) as CallsReceived,
    COUNT(CASE WHEN pci.CallerId = u.Id AND pci.Status = 'accepted' THEN 1 END) as CallsAccepted,
    COUNT(CASE WHEN pci.ReceiverId = u.Id AND pci.Status = 'rejected' THEN 1 END) as CallsRejected
FROM [dbo].[UserF] u
LEFT JOIN [dbo].[PrivateCallInvitations] pci 
    ON (u.Id = pci.CallerId OR u.Id = pci.ReceiverId)
GROUP BY u.Id, u.Username;

PRINT 'Private Calls database schema created successfully!'; 