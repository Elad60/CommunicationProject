using Microsoft.AspNetCore.Mvc;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace User.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        // POST api/<UserController>
        [HttpPost]
        public IActionResult Post(string userName, string passwordHash, string email, bool isAdmin)
        {
            return UserService.BL.UserService.Register(userName, passwordHash, email, isAdmin);
        }

    }
}
