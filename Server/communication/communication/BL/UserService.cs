using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace UserService.BL
{
    public class UserService
    {
        public static IActionResult Register(string userName, string passwordHash, string email, bool isAdmin)
        {
            SqlCommand cmd = DBservices.CreateStoredProdecureCommand("SPB_RegisterUser",
                "@UserName", userName,
                "@PasswordHash", passwordHash,
                "@Email", email,
                "@IsAdmin", isAdmin.ToString()
            );

            try
            {
                DBservices.ExecuteSqlProcedure(cmd, (cmd) => cmd.ExecuteNonQuery());
                return new JsonResult(new { message = "User Registered Successfully!" }) { StatusCode = 200 };
            }
            catch (SqlException sqlex)
            {
                if (sqlex.Message.ToLower().Contains("primary key"))
                {
                    return new JsonResult(new { message = "User Already Exists!" }) { StatusCode = 400 };
                }
                else return new JsonResult(new { message = "Error Adding User" }) { StatusCode = 400 };
            }
            catch (Exception e)
            {
                return new JsonResult(new { message = "Error Adding User:\n" + e.Message }) { StatusCode = 400 };
            }
        }
    }
}
