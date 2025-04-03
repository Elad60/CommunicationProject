using Microsoft.AspNetCore.Mvc;
using CommunicationServer.BL;
using CommunicationServer.DAL;


namespace CommunicationServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RadioChannelsController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetAllChannels()
        {
            try
            {
                DBServices dbs = new DBServices();
                List<RadioChannel> channels = dbs.GetAllRadioChannels();
                return Ok(channels);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error: {ex.Message}");
            }
        }
    }
}
