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
        // Endpoint for user registration
        [HttpPost("register")]
        public IActionResult Register([FromBody] UserRegistrationRequest req)
        {
            DBServices db = new DBServices();

            // Try to register the user
            bool success = db.RegisterUser(req.Username, req.Email, req.Password, req.Group);

            if (success)
            {
                // If registration is successful, also retrieve user data to return
                try
                {
                    // Get the user data by trying to log them in automatically
                    User user = db.LoginUser(req.Username, req.Password).User;
                    return Ok(new { success = true, user = user });
                }
                catch
                {
                    // If login fails after registration, still return success but without user data
                    return Ok(new { success = true });
                }
            }
            else
            {
                // Registration failed due to duplicate username or email
                return BadRequest(new { success = false, message = "Username or email already exists." });
            }
        }

        // Endpoint for user login
        [HttpPost("login")]
        public IActionResult Login([FromBody] UserLoginRequest req)
        {
            try
            {
                DBServices db = new DBServices();
                LoginResponse response = db.LoginUser(req.Username, req.Password);

                if (response.Success)
                {
                    return Ok(response); // Return 200 OK with user data
                }
                else
                {
                    // Return appropriate status code based on error
                    switch (response.ErrorCode)
                    {
                        case "USER_NOT_FOUND":
                        case "INVALID_PASSWORD":
                            return Unauthorized(response); // 401 Unauthorized

                        case "ALREADY_LOGGED_IN":
                            return Conflict(response); // 409 Conflict

                        case "USER_BLOCKED":
                            return StatusCode(403, response); // 403 Forbidden

                        default:
                            return StatusCode(500, response); // 500 Internal Server Error
                    }
                }
            }
            catch (Exception ex)
            {
                // Return error in case of unexpected exception
                return StatusCode(500, new LoginResponse
                {
                    Success = false,
                    ErrorCode = "SERVER_ERROR",
                    Message = "An unexpected error occurred: " + ex.Message
                });
            }
        }

        // Endpoint to log out a user by ID
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

        // Get a list of all users
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

        // Block or unblock a user
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

        // Update a user's role (e.g. admin/user)
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

        // Delete a user by ID
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

        // Change a user's group assignment
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

        // Get a list of users by group name
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
