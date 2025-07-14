using Microsoft.AspNetCore.Mvc;
using CommunicationServer.BL;
using CommunicationServer.DAL;
using System.Security.Cryptography;
using System.Text;

namespace CommunicationServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RadioChannelsController : ControllerBase
    {
        // 📌 Get all available radio channels
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

        // 📌 Get radio channels assigned to a specific user
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

        public class ChannelStateUpdateDto
        {
            public string? newState { get; set; }
            public string? pinCode { get; set; } // optional
        }

        // 📌 Update the state of a user's channel (e.g., active/inactive)
        [HttpPost("user/{userId}/channel/{channelId}/state")]
        public IActionResult UpdateChannelState(int userId, int channelId, [FromBody] ChannelStateUpdateDto dto)
        {
            try
            {
                Console.WriteLine($"newState: {dto?.newState}, pinCode: {dto?.pinCode}");
                DBServices dbs = new DBServices();
                var channel = dbs.GetRadioChannelById(channelId);
                if (channel == null)
                    return NotFound("Channel not found");
                // Only validate PIN if provided (frontend controls when PIN is needed)
                if (channel.Mode == "Private" && !string.IsNullOrEmpty(dto.pinCode))
                {
                    string hashedPin;
                    using (SHA256 sha256 = SHA256.Create())
                    {
                        byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(dto.pinCode));
                        StringBuilder builder = new StringBuilder();
                        foreach (var b in bytes)
                            builder.Append(b.ToString("x2"));
                        hashedPin = builder.ToString();
                    }
                    if (hashedPin != channel.PinCodeHash)
                        return Unauthorized("Incorrect PIN");
                }
                dbs.UpdateUserChannelState(userId, channelId, dto.newState);
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error updating channel state: {ex.Message}");
            }
        }

        // 📌 Add a new radio channel
        [HttpPost]
        public IActionResult AddChannel([FromBody] RadioChannel newChannel)
        {
            try
            {
                // PinCode is only used for creation, not stored or returned
                DBServices db = new DBServices();
                db.AddRadioChannel(newChannel);
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // 📌 Delete a radio channel by its ID
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

        // 📌 Add an existing channel to a user's assigned channels
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

        // 📌 Remove a channel from a user's assigned channels
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

        // 📌 Get all participants (users listening) in a specific radio channel
        [HttpGet("{channelId}/participants")]
        public IActionResult GetChannelParticipants(int channelId)
        {
            try
            {
                DBServices dbs = new DBServices();
                var participants = dbs.GetChannelParticipants(channelId);
                return Ok(participants);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error retrieving channel participants: {ex.Message}");
            }
        }
    }
}
