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

            bool success = db.RegisterUser(req.Username, req.Email, req.Password);

            if (success)
                return Ok(new { success = true });
            else
                return BadRequest(new { success = false, message = "Username or email already exists." });
        }
        [HttpPost("login")]
        public IActionResult Login([FromBody] UserLoginRequest req)
        {
            DBServices db = new DBServices();
            User user = db.LoginUser(req.Username, req.Password);

            if (user != null)
                return Ok(new { success = true, user });
            else
                return Unauthorized(new { success = false, message = "Invalid username or password" });
        }


    }
}
