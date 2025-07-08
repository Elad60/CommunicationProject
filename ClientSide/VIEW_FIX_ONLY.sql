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