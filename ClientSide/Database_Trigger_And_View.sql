-- ================================================
-- יצירת הטריגר - הרץ זה בבלוק נפרד
-- ================================================

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

PRINT 'Trigger created successfully!';

-- ================================================
-- יצירת ה-VIEW - הרץ זה בבלוק נפרד
-- ================================================

CREATE VIEW [dbo].[VW_PrivateCallStats] AS
SELECT 
    u.Id as UserId,
    u.Username,
    COUNT(CASE WHEN pci.CallerId = u.Id THEN 1 END) as CallsMade,
    COUNT(CASE WHEN pci.ReceiverId = u.Id THEN 1 END) as CallsReceived,
    COUNT(CASE WHEN pci.CallerId = u.Id AND pci.Status = 'accepted' THEN 1 END) as CallsAccepted,
    COUNT(CASE WHEN pci.ReceiverId = u.Id AND pci.Status = 'rejected' THEN 1 END) as CallsRejected
FROM [dbo].[UsersF] u
LEFT JOIN [dbo].[PrivateCallInvitations] pci 
    ON (u.Id = pci.CallerId OR u.Id = pci.ReceiverId)
GROUP BY u.Id, u.Username;

GO

PRINT 'View created successfully!';

-- ================================================
-- בדיקה שהכל עובד
-- ================================================

-- בדיקה שהטבלות נוצרו
SELECT 
    TABLE_NAME,
    TABLE_TYPE
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_NAME IN ('PrivateCallInvitations', 'PrivateCallHistory');

-- בדיקה שהאינדקסים נוצרו
SELECT 
    i.name AS IndexName,
    t.name AS TableName,
    c.name AS ColumnName
FROM sys.indexes i
JOIN sys.tables t ON i.object_id = t.object_id
JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
WHERE t.name IN ('PrivateCallInvitations', 'PrivateCallHistory')
    AND i.name IS NOT NULL
ORDER BY t.name, i.name;

PRINT 'Database setup validation completed!'; 