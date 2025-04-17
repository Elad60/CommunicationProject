using CommunicationServer.BL;
using CommunicationServer.DAL;
using Microsoft.AspNetCore.Mvc;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace CommunicationServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AnnouncementController : ControllerBase
    {
        [HttpPost("announcement")]
        public IActionResult AddAnnouncement([FromBody] Announcement announcement)
        {
            try
            {
                DBServices db = new DBServices();
                bool success = db.AddAnnouncement(announcement.Title, announcement.Content, announcement.UserName);

                if (success)
                    return Ok(new { success = true });
                else
                    return BadRequest(new { success = false });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("announcements")]
        public IActionResult GetAllAnnouncements()
        {
            try
            {
                DBServices db = new DBServices();
                var announcements = db.GetAllAnnouncements();
                return Ok(announcements);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
        [HttpGet("announcements/withReadStatus/{userId}")]
        public IActionResult GetAnnouncementsWithReadStatus(int userId)
        {
            try
            {
                DBServices db = new DBServices();
                var announcements = db.GetAllAnnouncementsWithReadStatus(userId);
                return Ok(announcements);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("announcements/markAllAsRead/{userId}")]
        public IActionResult MarkAllAnnouncementsAsRead(int userId)
        {
            try
            {
                DBServices db = new DBServices();
                bool success = db.MarkAllAnnouncementsAsRead(userId);
                if (success)
                    return Ok(new { success = true });
                else
                    return BadRequest(new { success = false });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("announcements/unreadCount/{userId}")]
        public IActionResult GetUnreadAnnouncementsCount(int userId)
        {
            try
            {
                DBServices db = new DBServices();
                int count = db.GetUnreadAnnouncementsCount(userId);
                return Ok(new { count = count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
