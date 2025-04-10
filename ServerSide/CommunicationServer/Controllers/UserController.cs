using CommunicationServer.DAL;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using CommunicationServer.BL;
namespace CommunicationServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {

        [HttpPost("register")]
        public IActionResult Register([FromBody] UserRegistrationRequest req)
        {
            DBServices db = new DBServices();

            bool success = db.RegisterUser(req.Username, req.Email, req.Password, req.Group);

            if (success)
                return Ok(new { success = true });
            else
                return BadRequest(new { success = false, message = "Username or email already exists." });
        }
        [HttpPost("login")]
        public IActionResult Login([FromBody] UserLoginRequest req)
        {
            try
            {
                DBServices db = new DBServices();
                User user = db.LoginUser(req.Username, req.Password);

                if (user != null)
                    return Ok(new { success = true, user });
                else
                    return Unauthorized(new { success = false, message = "Invalid username or password" });
            }
            catch (Exception ex)
            {
                // נחזיר את הודעת השגיאה מה-SP אם נזרקה
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("logout/{userId}")]
        public IActionResult Logout(int userId)
        {
            DBServices db = new DBServices();
            bool success = db.LogoutUser(userId);

            if (success)
                return Ok(new { success = true, message = "User logged out successfully." });
            else
                return BadRequest(new { success = false, message = "Logout failed." });
        }

        [HttpGet("all")]
        public IActionResult GetAllUsers()
        {
            try
            {
                DBServices db = new DBServices();
                List<User> users = db.GetAllUsers();

                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
        [HttpPost("block/{userId}")]
        public IActionResult BlockUser(int userId, [FromBody] bool isBlocked)
        {
            DBServices db = new DBServices();

            try
            {
                bool success = db.SetUserBlockedStatus(userId, isBlocked);
                if (success)
                    return Ok(new { success = true });
                else
                    return BadRequest(new { success = false, message = "User not found or update failed." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
        [HttpPost("update-role")]
        public IActionResult UpdateUserRole([FromBody] UpdateUserRoleRequest req)
        {
            DBServices db = new DBServices();
            bool success = db.UpdateUserRole(req.UserId, req.NewRole);

            if (success)
                return Ok(new { success = true });
            else
                return BadRequest(new { success = false, message = "Failed to update user role." });
        }
        [HttpDelete("{userId}")]
        public IActionResult DeleteUser(int userId)
        {
            DBServices db = new DBServices();
            bool success = db.DeleteUser(userId);

            if (success)
                return Ok(new { success = true });
            else
                return BadRequest(new { success = false, message = "Failed to delete user." });
        }
        [HttpPost("change-group/{userId}")]
        public IActionResult ChangeUserGroup(int userId, [FromBody] char newGroup)
        {
            DBServices db = new DBServices();

            try
            {
                bool success = db.ChangeUserGroup(userId, newGroup);
                if (success)
                    return Ok(new { success = true, message = "User group updated successfully." });
                else
                    return BadRequest(new { success = false, message = "User not found or update failed." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("group/{groupName}")]
        public IActionResult GetUsersByGroup(char groupName)
        {
            try
            {
                DBServices db = new DBServices();
                List<User> users = db.GetUsersByGroup(groupName);

                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
