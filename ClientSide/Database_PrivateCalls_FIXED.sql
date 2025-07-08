-- ================================================
-- שלב 1: יצירת הטבלה הראשית
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
    
    -- Foreign Keys (אם שם הטבלה שלך לא UsersF תשנה את זה)
    CONSTRAINT [FK_PrivateCallInvitations_Caller] 
        FOREIGN KEY ([CallerId]) REFERENCES [dbo].[UsersF]([Id]),
    CONSTRAINT [FK_PrivateCallInvitations_Receiver] 
        FOREIGN KEY ([ReceiverId]) REFERENCES [dbo].[UsersF]([Id]),
    
    -- Constraints
    CONSTRAINT [CK_PrivateCallInvitations_Status] 
        CHECK ([Status] IN ('pending', 'accepted', 'rejected', 'timeout', 'cancelled')),
    CONSTRAINT [CK_PrivateCallInvitations_NotSameUser] 
        CHECK ([CallerId] != [ReceiverId])
);

PRINT 'PrivateCallInvitations table created successfully!';

-- ================================================
-- שלב 2: יצירת הטבלה השנייה (היסטוריה)
-- ================================================

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

PRINT 'PrivateCallHistory table created successfully!';

-- ================================================
-- שלב 3: יצירת אינדקסים לביצועים
-- ================================================

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

-- אינדקס להיסטוריה
CREATE INDEX [IX_PrivateCallHistory_CallerId] 
    ON [dbo].[PrivateCallHistory] ([CallerId]);

CREATE INDEX [IX_PrivateCallHistory_ReceiverId] 
    ON [dbo].[PrivateCallHistory] ([ReceiverId]);

CREATE INDEX [IX_PrivateCallHistory_StartedAt] 
    ON [dbo].[PrivateCallHistory] ([StartedAt]);

PRINT 'Indexes created successfully!';

-- ================================================
-- שלב 4: יצירת הטריגר
-- ================================================

-- השתמש בקובץ נפרד עבור הטריגר וה-VIEW
-- או הרץ את הקטעים האלה בנפרד:

/*
-- 4. Trigger לעדכון UpdatedAt אוטומטי
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
*/

PRINT 'Database tables setup completed! Now run the trigger and view in separate batches.'; 