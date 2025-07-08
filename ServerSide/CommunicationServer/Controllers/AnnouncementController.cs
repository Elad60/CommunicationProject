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
        // 📌 Add a new announcement
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

        // 📌 Get all announcements
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

        // 📌 Get announcements with user-specific read status
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

        // 📌 Mark all announcements as read for a user
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

        // 📌 Get count of unread announcements for a user
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
