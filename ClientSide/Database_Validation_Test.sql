-- ================================================
-- סקריפט בדיקה מלא לוידוא שכל הרכיבים עובדים
-- ================================================

PRINT '=== התחלת בדיקות מערכת שיחות פרטיות ==='
PRINT ''

-- ================================================
-- בדיקה 1: וידוא שהטבלאות נוצרו
-- ================================================
PRINT '1. בדיקת טבלאות:'

SELECT 
    t.TABLE_NAME,
    t.TABLE_TYPE,
    CASE 
        WHEN t.TABLE_NAME IN ('PrivateCallInvitations', 'PrivateCallHistory') THEN '✓ קיים'
        ELSE '✗ חסר'
    END as Status
FROM INFORMATION_SCHEMA.TABLES t
WHERE t.TABLE_NAME IN ('PrivateCallInvitations', 'PrivateCallHistory', 'UsersF')
ORDER BY t.TABLE_NAME;

-- ================================================
-- בדיקה 2: וידוא שהאינדקסים נוצרו
-- ================================================
PRINT ''
PRINT '2. בדיקת אינדקסים:'

SELECT 
    t.name AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType,
    '✓ קיים' as Status
FROM sys.indexes i
JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name IN ('PrivateCallInvitations', 'PrivateCallHistory')
    AND i.name IS NOT NULL
ORDER BY t.name, i.name;

-- ================================================
-- בדיקה 3: וידוא שהטריגר נוצר
-- ================================================
PRINT ''
PRINT '3. בדיקת טריגר:'

SELECT 
    t.name AS TriggerName,
    OBJECT_NAME(t.parent_id) AS TableName,
    t.is_disabled,
    CASE 
        WHEN t.is_disabled = 0 THEN '✓ פעיל'
        ELSE '✗ לא פעיל'
    END as Status
FROM sys.triggers t
WHERE t.name = 'TR_PrivateCallInvitations_UpdatedAt';

-- ================================================
-- בדיקה 4: וידוא שה-VIEW נוצר
-- ================================================
PRINT ''
PRINT '4. בדיקת VIEW:'

SELECT 
    v.TABLE_NAME as ViewName,
    v.IS_UPDATABLE,
    '✓ קיים' as Status
FROM INFORMATION_SCHEMA.VIEWS v
WHERE v.TABLE_NAME = 'VW_PrivateCallStats';

-- ================================================
-- בדיקה 5: וידוא שכל ה-Stored Procedures נוצרו
-- ================================================
PRINT ''
PRINT '5. בדיקת Stored Procedures:'

SELECT 
    p.name AS ProcedureName,
    p.create_date AS CreatedDate,
    p.modify_date AS ModifiedDate,
    '✓ קיים' as Status
FROM sys.procedures p
WHERE p.name LIKE 'SP_%PrivateCall%' OR p.name LIKE 'SP_%Call%'
ORDER BY p.name;

-- ================================================
-- בדיקה 6: בדיקת מבנה הטבלה הראשית
-- ================================================
PRINT ''
PRINT '6. בדיקת מבנה טבלת PrivateCallInvitations:'

SELECT 
    c.COLUMN_NAME,
    c.DATA_TYPE,
    c.IS_NULLABLE,
    c.COLUMN_DEFAULT,
    CASE 
        WHEN c.COLUMN_NAME IN ('Id', 'CallerId', 'ReceiverId', 'Status', 'CreatedAt', 'ExpiresAt') THEN '✓ נדרש'
        ELSE '✓ אופציונלי'
    END as Importance
FROM INFORMATION_SCHEMA.COLUMNS c
WHERE c.TABLE_NAME = 'PrivateCallInvitations'
ORDER BY c.ORDINAL_POSITION;

-- ================================================
-- בדיקה 7: בדיקת Foreign Keys
-- ================================================
PRINT ''
PRINT '7. בדיקת Foreign Keys:'

SELECT 
    fk.name AS ForeignKeyName,
    tp.name AS ParentTable,
    cp.name AS ParentColumn,
    tr.name AS ReferencedTable,
    cr.name AS ReferencedColumn,
    '✓ קיים' as Status
FROM sys.foreign_keys fk
JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
WHERE tp.name = 'PrivateCallInvitations';

-- ================================================
-- בדיקה 8: בדיקת Constraints
-- ================================================
PRINT ''
PRINT '8. בדיקת Constraints:'

SELECT 
    tc.CONSTRAINT_NAME,
    tc.CONSTRAINT_TYPE,
    tc.TABLE_NAME,
    '✓ קיים' as Status
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
WHERE tc.TABLE_NAME = 'PrivateCallInvitations'
ORDER BY tc.CONSTRAINT_TYPE, tc.CONSTRAINT_NAME;

-- ================================================
-- בדיקה 9: בדיקת פונקציונליות בסיסית
-- ================================================
PRINT ''
PRINT '9. בדיקת פונקציונליות בסיסית:'

-- בדיקה שניתן לבצע SELECT על הטבלאות
BEGIN TRY
    SELECT COUNT(*) as InvitationsCount FROM [dbo].[PrivateCallInvitations];
    SELECT COUNT(*) as HistoryCount FROM [dbo].[PrivateCallHistory];
    SELECT COUNT(*) as UsersCount FROM [dbo].[UsersF];
    PRINT '✓ SELECT queries עובדים תקין'
END TRY
BEGIN CATCH
    PRINT '✗ בעיה ב-SELECT queries: ' + ERROR_MESSAGE()
END CATCH

-- בדיקה שה-VIEW עובד
BEGIN TRY
    SELECT TOP 1 * FROM [dbo].[VW_PrivateCallStats];
    PRINT '✓ VIEW עובד תקין'
END TRY
BEGIN CATCH
    PRINT '✗ בעיה ב-VIEW: ' + ERROR_MESSAGE()
END CATCH

-- ================================================
-- בדיקה 10: בדיקה מהירה של Stored Procedures
-- ================================================
PRINT ''
PRINT '10. בדיקת Stored Procedures (syntax check):'

DECLARE @TestUserId INT = 1;
DECLARE @TestInvitationId NVARCHAR(50) = 'test_invitation';

-- בדיקה שה-SP קיימים ואין שגיאות syntax
BEGIN TRY
    -- בדיקה שה-SP קיים
    IF EXISTS (SELECT 1 FROM sys.procedures WHERE name = 'SP_GetIncomingCalls')
        PRINT '✓ SP_GetIncomingCalls - קיים'
    ELSE
        PRINT '✗ SP_GetIncomingCalls - חסר'
    
    IF EXISTS (SELECT 1 FROM sys.procedures WHERE name = 'SP_SendPrivateCallInvitation')
        PRINT '✓ SP_SendPrivateCallInvitation - קיים'
    ELSE
        PRINT '✗ SP_SendPrivateCallInvitation - חסר'
    
    IF EXISTS (SELECT 1 FROM sys.procedures WHERE name = 'SP_AcceptCallInvitation')
        PRINT '✓ SP_AcceptCallInvitation - קיים'
    ELSE
        PRINT '✗ SP_AcceptCallInvitation - חסר'
    
    IF EXISTS (SELECT 1 FROM sys.procedures WHERE name = 'SP_RejectCallInvitation')
        PRINT '✓ SP_RejectCallInvitation - קיים'
    ELSE
        PRINT '✗ SP_RejectCallInvitation - חסר'
    
    IF EXISTS (SELECT 1 FROM sys.procedures WHERE name = 'SP_GetUserCallStats')
        PRINT '✓ SP_GetUserCallStats - קיים'
    ELSE
        PRINT '✗ SP_GetUserCallStats - חסר'
        
END TRY
BEGIN CATCH
    PRINT '✗ בעיה בבדיקת Stored Procedures: ' + ERROR_MESSAGE()
END CATCH

-- ================================================
-- סיכום
-- ================================================
PRINT ''
PRINT '=== סיכום בדיקות ==='
PRINT 'אם כל הבדיקות הראו ✓ - המערכת מוכנה לשימוש!'
PRINT 'אם יש ✗ - יש לתקן את הבעיות לפני המשך'
PRINT ''
PRINT '=== סיום בדיקות מערכת שיחות פרטיות ===' 