CREATE PROCEDURE SPB_RegisterUser
    @UserName NVARCHAR(50),
    @PasswordHash NVARCHAR(255),
    @Email NVARCHAR(100),
    @IsAdmin BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO [dbo].[Users] ([Username], [PasswordHash], [Email], [IsAdmin])
    VALUES (@Username, @PasswordHash, @Email, @IsAdmin);
END;
