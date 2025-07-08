using CommunicationServer.BL;
using CommunicationServer.DAL;
using Microsoft.AspNetCore.Mvc;

namespace CommunicationServer.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PrivateCallsController : ControllerBase
    {
        /// <summary>
        /// Send a private call invitation to another user
        /// </summary>
        /// <param name="request">Call invitation request with caller and receiver IDs</param>
        /// <returns>Invitation details including invitation ID and channel name</returns>
        [HttpPost("send")]
        public IActionResult SendInvitation([FromBody] SendCallInvitationRequest request)
        {
            try
            {
                DBServices db = new DBServices();
                var response = db.SendPrivateCallInvitation(request.CallerId, request.ReceiverId);
                
                if (response.Success)
                    return Ok(response);
                else
                    return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new SendCallInvitationResponse
                {
                    Success = false,
                    Message = "Server error: " + ex.Message
                });
            }
        }

        /// <summary>
        /// Get incoming call invitations for a user
        /// </summary>
        /// <param name="userId">User ID to check for incoming calls</param>
        /// <returns>List of incoming call invitations</returns>
        [HttpGet("incoming/{userId}")]
        public IActionResult GetIncomingCalls(int userId)
        {
            try
            {
                DBServices db = new DBServices();
                var response = db.GetIncomingCalls(userId);
                
                if (response.Success)
                    return Ok(response);
                else
                    return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new GetIncomingCallsResponse
                {
                    Success = false,
                    IncomingCalls = new List<IncomingCallInvitation>(),
                    Count = 0
                });
            }
        }

        /// <summary>
        /// Accept a private call invitation
        /// </summary>
        /// <param name="request">Accept invitation request with invitation ID and user ID</param>
        /// <returns>Acceptance confirmation with channel details</returns>
        [HttpPost("accept")]
        public IActionResult AcceptInvitation([FromBody] AcceptCallInvitationRequest request)
        {
            try
            {
                DBServices db = new DBServices();
                var response = db.AcceptCallInvitation(request.InvitationId, request.UserId);
                
                if (response.Success)
                    return Ok(response);
                else
                    return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new AcceptCallInvitationResponse
                {
                    Success = false,
                    Message = "Server error: " + ex.Message
                });
            }
        }

        /// <summary>
        /// Reject a private call invitation
        /// </summary>
        /// <param name="request">Reject invitation request with invitation ID and user ID</param>
        /// <returns>Rejection confirmation</returns>
        [HttpPost("reject")]
        public IActionResult RejectInvitation([FromBody] RejectCallInvitationRequest request)
        {
            try
            {
                DBServices db = new DBServices();
                var response = db.RejectCallInvitation(request.InvitationId, request.UserId);
                
                if (response.Success)
                    return Ok(response);
                else
                    return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new RejectCallInvitationResponse
                {
                    Success = false,
                    Message = "Server error: " + ex.Message
                });
            }
        }

        /// <summary>
        /// Cancel a private call invitation (for caller)
        /// </summary>
        /// <param name="request">Cancel invitation request with invitation ID and user ID</param>
        /// <returns>Cancellation confirmation</returns>
        [HttpPost("cancel")]
        public IActionResult CancelInvitation([FromBody] CancelCallInvitationRequest request)
        {
            try
            {
                DBServices db = new DBServices();
                var response = db.CancelCallInvitation(request.InvitationId, request.UserId);
                
                if (response.Success)
                    return Ok(response);
                else
                    return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new CancelCallInvitationResponse
                {
                    Success = false,
                    Message = "Server error: " + ex.Message
                });
            }
        }

        /// <summary>
        /// Get the status of a private call invitation
        /// </summary>
        /// <param name="invitationId">Invitation ID</param>
        /// <param name="userId">User ID requesting the status</param>
        /// <returns>Current status of the invitation</returns>
        [HttpGet("status/{invitationId}/{userId}")]
        public IActionResult GetCallStatus(string invitationId, int userId)
        {
            try
            {
                DBServices db = new DBServices();
                var response = db.GetCallStatus(invitationId, userId);
                
                if (response.Success)
                    return Ok(response);
                else
                    return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new GetCallStatusResponse
                {
                    Success = false
                });
            }
        }

        /// <summary>
        /// End a private call
        /// </summary>
        /// <param name="request">End call request with invitation ID and optional end reason</param>
        /// <returns>End call confirmation</returns>
        [HttpPost("end")]
        public IActionResult EndCall([FromBody] EndCallRequest request)
        {
            try
            {
                DBServices db = new DBServices();
                var response = db.EndPrivateCall(request.InvitationId, request.EndReason);
                
                if (response.Success)
                    return Ok(response);
                else
                    return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new EndCallResponse
                {
                    Success = false,
                    Message = "Server error: " + ex.Message
                });
            }
        }

        /// <summary>
        /// Get call statistics for a user
        /// </summary>
        /// <param name="userId">User ID to get statistics for</param>
        /// <param name="daysBack">Number of days back to analyze (default: 30)</param>
        /// <returns>User call statistics</returns>
        [HttpGet("stats/{userId}")]
        public IActionResult GetUserCallStats(int userId, [FromQuery] int daysBack = 30)
        {
            try
            {
                DBServices db = new DBServices();
                var response = db.GetUserCallStats(userId, daysBack);
                
                if (response.Success)
                    return Ok(response);
                else
                    return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new GetUserCallStatsResponse
                {
                    Success = false
                });
            }
        }

        /// <summary>
        /// Cleanup old call invitations (maintenance endpoint)
        /// </summary>
        /// <param name="daysToKeep">Number of days to keep invitations (default: 7)</param>
        /// <returns>Cleanup results</returns>
        [HttpPost("cleanup")]
        public IActionResult CleanupOldInvitations([FromQuery] int daysToKeep = 7)
        {
            try
            {
                DBServices db = new DBServices();
                var response = db.CleanupOldInvitations(daysToKeep);
                
                if (response.Success)
                    return Ok(response);
                else
                    return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new CleanupOldInvitationsResponse
                {
                    Success = false,
                    Message = "Server error: " + ex.Message
                });
            }
        }
    }
} 