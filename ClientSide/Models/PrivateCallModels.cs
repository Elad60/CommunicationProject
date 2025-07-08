using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using System.Collections.Generic; // Added for List

namespace YourProjectName.Models
{
    // DTOs for Private Call API

    public class SendCallInvitationRequest
    {
        [Required]
        public int CallerId { get; set; }

        [Required]
        public int ReceiverId { get; set; }
    }

    public class SendCallInvitationResponse
    {
        public string InvitationId { get; set; }
        public string ChannelName { get; set; }
        public string Message { get; set; }
        public bool Success { get; set; }
    }

    public class AcceptCallInvitationRequest
    {
        [Required]
        public string InvitationId { get; set; }

        [Required]
        public int UserId { get; set; }
    }

    public class AcceptCallInvitationResponse
    {
        public string InvitationId { get; set; }
        public string ChannelName { get; set; }
        public string Message { get; set; }
        public string Status { get; set; }
        public bool Success { get; set; }
    }

    public class RejectCallInvitationRequest
    {
        [Required]
        public string InvitationId { get; set; }

        [Required]
        public int UserId { get; set; }
    }

    public class RejectCallInvitationResponse
    {
        public string InvitationId { get; set; }
        public string Message { get; set; }
        public string Status { get; set; }
        public bool Success { get; set; }
    }

    public class CancelCallInvitationRequest
    {
        [Required]
        public string InvitationId { get; set; }

        [Required]
        public int UserId { get; set; }
    }

    public class CancelCallInvitationResponse
    {
        public string InvitationId { get; set; }
        public string Message { get; set; }
        public string Status { get; set; }
        public bool Success { get; set; }
    }

    public class GetCallStatusRequest
    {
        [Required]
        public string InvitationId { get; set; }

        [Required]
        public int UserId { get; set; }
    }

    public class GetCallStatusResponse
    {
        public string InvitationId { get; set; }
        public string Status { get; set; }
        public string ChannelName { get; set; }
        public DateTime Timestamp { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public string Direction { get; set; }
        public bool Success { get; set; }
    }

    public class EndCallRequest
    {
        [Required]
        public string InvitationId { get; set; }

        public string EndReason { get; set; } = "completed";
    }

    public class EndCallResponse
    {
        public string InvitationId { get; set; }
        public string Message { get; set; }
        public string EndReason { get; set; }
        public bool Success { get; set; }
    }

    public class IncomingCallInvitation
    {
        public string Id { get; set; }
        public int CallerId { get; set; }
        public string CallerName { get; set; }
        public string CallerEmail { get; set; }
        public string CallerRole { get; set; }
        public string ChannelName { get; set; }
        public DateTime Timestamp { get; set; }
        public DateTime ExpiresAt { get; set; }
        public string Status { get; set; }
    }

    public class GetIncomingCallsResponse
    {
        public List<IncomingCallInvitation> IncomingCalls { get; set; }
        public int Count { get; set; }
        public bool Success { get; set; }
    }

    public class UserCallStats
    {
        public int UserId { get; set; }
        public string Username { get; set; }
        public int CallsMade { get; set; }
        public int CallsReceived { get; set; }
        public int CallsAccepted { get; set; }
        public int CallsRejected { get; set; }
        public int CallsTimedOut { get; set; }
        public double? AvgCallDurationSeconds { get; set; }
    }

    public class GetUserCallStatsResponse
    {
        public UserCallStats Stats { get; set; }
        public bool Success { get; set; }
    }

    public class CleanupOldInvitationsResponse
    {
        public int DeletedInvitations { get; set; }
        public DateTime CutoffDate { get; set; }
        public string Message { get; set; }
        public bool Success { get; set; }
    }

    // Generic API Response wrapper
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; }
        public T Data { get; set; }
        public string ErrorCode { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

    // Error response for consistent error handling
    public class ErrorResponse
    {
        public string ErrorCode { get; set; }
        public string ErrorMessage { get; set; }
        public string Details { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
} 