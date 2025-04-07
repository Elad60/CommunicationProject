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
        [HttpGet("user/{userId}")]
        public IActionResult GetUserChannels(int userId)
        {
            try
            {
                DBServices dbs = new DBServices();
                var channels = dbs.GetUserRadioChannels(userId);
                return Ok(channels);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving user channels: {ex.Message}");
            }
        }
        [HttpPost("user/{userId}/channel/{channelId}/state")]
        public IActionResult UpdateChannelState(int userId, int channelId, [FromBody] string newState)
        {
            try
            {
                DBServices dbs = new DBServices();
                dbs.UpdateUserChannelState(userId, channelId, newState);
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error updating channel state: {ex.Message}");
            }
        }
        [HttpPost]
        public IActionResult AddChannel([FromBody] RadioChannel newChannel)
        {
            try
            {
                DBServices db = new DBServices();
                db.AddRadioChannel(newChannel);
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteChannel(int id)
        {
            try
            {
                DBServices db = new DBServices();
                db.DeleteRadioChannel(id);
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
        [HttpPost("user/{userId}/add-channel/{channelId}")]
        public IActionResult AddUserChannel(int userId, int channelId)
        {
            try
            {
                DBServices db = new DBServices();
                db.AddUserChannel(userId, channelId);
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpDelete("user/{userId}/remove-channel/{channelId}")]
        public IActionResult RemoveUserChannel(int userId, int channelId)
        {
            try
            {
                DBServices db = new DBServices();
                db.RemoveUserChannel(userId, channelId);
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }



    }
}
