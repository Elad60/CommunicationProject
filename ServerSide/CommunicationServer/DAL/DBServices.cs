using CommunicationServer.BL;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;

namespace CommunicationServer.DAL
{
    public class DBServices
    {
        // Method to connect to DB using appsettings.json
        public SqlConnection Connect(string conString)
        {
            IConfigurationRoot configuration = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .Build();

            string cStr = configuration.GetConnectionString("myProjDB");
            SqlConnection con = new SqlConnection(cStr);
            con.Open();
            return con;
        }

        // Create SqlCommand with stored procedure and optional parameters
        private SqlCommand CreateCommandWithStoredProcedure(string spName, SqlConnection con, Dictionary<string, object> paramDic)
        {
            SqlCommand cmd = new SqlCommand
            {
                Connection = con,
                CommandText = spName,
                CommandTimeout = 10,
                CommandType = CommandType.StoredProcedure
            };

            if (paramDic != null)
            {
                foreach (var param in paramDic)
                {
                    cmd.Parameters.AddWithValue(param.Key, param.Value);
                }
            }

            return cmd;
        }

        //Radio channels

        // Get all radio channels using stored procedure
        public List<RadioChannel> GetAllRadioChannels()
        {
            SqlConnection con = null;
            List<RadioChannel> channels = new List<RadioChannel>();

            try
            {
                con = Connect("myProjDB");
                SqlCommand cmd = CreateCommandWithStoredProcedure("sp_GetAllRadioChannels", con, null);
                SqlDataReader reader = cmd.ExecuteReader();

                while (reader.Read())
                {
                    RadioChannel channel = new RadioChannel
                    {
                        Id = Convert.ToInt32(reader["Id"]),
                        Name = reader["Name"].ToString(),
                        Frequency = reader["Frequency"].ToString(),
                        Status = reader["Status"].ToString(),
                        Mode = reader["Mode"].ToString(),
                        ChannelState = reader["ChannelState"].ToString()
                    };


                    channels.Add(channel);
                }

                reader.Close();
            }
            catch (Exception ex)
            {
                throw new Exception("Error retrieving radio channels: " + ex.Message);
            }
            finally
            {
                con?.Close();
            }

            return channels;
        }
        public List<RadioChannel> GetUserRadioChannels(int userId)
        {
            SqlConnection con = null;
            List<RadioChannel> channels = new List<RadioChannel>();

            try
            {
                con = Connect("myProjDB");

                var parameters = new Dictionary<string, object>
        {
            { "@UserId", userId }
        };

                SqlCommand cmd = CreateCommandWithStoredProcedure("sp_GetUserRadioChannels", con, parameters);
                SqlDataReader reader = cmd.ExecuteReader();

                while (reader.Read())
                {
                    RadioChannel channel = new RadioChannel
                    {
                        Id = Convert.ToInt32(reader["Id"]),
                        Name = reader["Name"].ToString(),
                        Frequency = reader["Frequency"].ToString(),
                        Status = reader["Status"].ToString(),
                        Mode = reader["Mode"].ToString(),
                        ChannelState = reader["ChannelState"].ToString()
                    };

                    channels.Add(channel);
                }

                reader.Close();
            }
            catch (Exception ex)
            {
                throw new Exception("Error retrieving user-specific radio channels: " + ex.Message);
            }
            finally
            {
                con?.Close();
            }

            return channels;
        }

        public void UpdateUserChannelState(int userId, int channelId, string channelState)
        {
            SqlConnection con = null;

            try
            {
                con = Connect("myProjDB");

                var parameters = new Dictionary<string, object>
        {
            { "@UserId", userId },
            { "@ChannelId", channelId },
            { "@ChannelState", channelState }
        };

                SqlCommand cmd = CreateCommandWithStoredProcedure("sp_UpdateUserChannelState", con, parameters);
                cmd.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                throw new Exception("Error updating user channel state: " + ex.Message);
            }
            finally
            {
                con?.Close();
            }
        }

        //Users

        public bool RegisterUser(string username, string email, string password, char group)
        {
            SqlConnection con = null;
            try
            {
                con = Connect("myProjDB");

                var paramDic = new Dictionary<string, object>
        {
            { "@Username", username },
            { "@Email", email },
            { "@Password", password },
            { "@Group", group }
        };

                SqlCommand cmd = CreateCommandWithStoredProcedure("sp_RegisterUser", con, paramDic);
                cmd.ExecuteNonQuery();

                return true;
            }
            catch (SqlException ex)
            {
                // Handle duplicate username/email error if needed
                Console.WriteLine("SQL Error: " + ex.Message);
                return false;
            }
            finally
            {
                con?.Close();
            }
        }
        public LoginResponse LoginUser(string username, string password)
        {
            SqlConnection con = null;
            try
            {
                con = Connect("myProjDB");
                var paramDic = new Dictionary<string, object>
        {
            { "@Username", username },
            { "@Password", password }
        };
                SqlCommand cmd = CreateCommandWithStoredProcedure("sp_LoginUser", con, paramDic);
                SqlDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                {
                    var response = new LoginResponse
                    {
                        Success = reader["Success"] != DBNull.Value ? Convert.ToBoolean(reader["Success"]) : false,
                        ErrorCode = reader["ErrorCode"]?.ToString(),
                        Message = reader["Message"]?.ToString()
                    };

                    // If login was successful, populate the User property
                    if (response.Success && reader.FieldCount > 3)
                    {
                        response.User = new User
                        {
                            Id = Convert.ToInt32(reader["Id"]),
                            Username = reader["Username"].ToString(),
                            Email = reader["Email"].ToString(),
                            Role = reader["Role"].ToString(),
                            Group = reader["Group"] != DBNull.Value ? Convert.ToChar(reader["Group"]) : '\0',
                            IsActive = Convert.ToBoolean(reader["IsActive"])
                        };
                    }

                    return response;
                }

                // If we got here, something went wrong but we didn't get an error
                return new LoginResponse
                {
                    Success = false,
                    ErrorCode = "UNKNOWN_ERROR",
                    Message = "An unknown error occurred during login."
                };
            }
            catch (SqlException ex)
            {
                // Handle any SQL exceptions
                return new LoginResponse
                {
                    Success = false,
                    ErrorCode = "DATABASE_ERROR",
                    Message = "Database error: " + ex.Message
                };
            }
            catch (Exception ex)
            {
                // Handle any other exceptions
                return new LoginResponse
                {
                    Success = false,
                    ErrorCode = "SERVER_ERROR",
                    Message = "Server error: " + ex.Message
                };
            }
            finally
            {
                con?.Close();
            }
        }
        public bool DeleteUser(int userId)
        {
            SqlConnection con = null;

            try
            {
                con = Connect("myProjDB");

                Dictionary<string, object> parameters = new Dictionary<string, object>
        {
            { "@UserId", userId }
        };

                SqlCommand cmd = CreateCommandWithStoredProcedure("sp_DeleteUser", con, parameters);
                int rowsAffected = cmd.ExecuteNonQuery();

                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                throw new Exception("Error deleting user: " + ex.Message);
            }
            finally
            {
                con?.Close();
            }
        }

        public List<User> GetAllUsers()
        {
            List<User> users = new List<User>();
            SqlConnection con = null;

            try
            {
                con = Connect("myProjDB");
                SqlCommand cmd = CreateCommandWithStoredProcedure("sp_GetAllUsers", con, null);
                SqlDataReader reader = cmd.ExecuteReader();

                while (reader.Read())
                {
                    users.Add(new User
                    {
                        Id = Convert.ToInt32(reader["Id"]),
                        Username = reader["Username"].ToString(),
                        Email = reader["Email"].ToString(),
                        Role = reader["Role"].ToString(),
                        CreatedAt = Convert.ToDateTime(reader["CreatedAt"]),
                        IsBlocked = Convert.ToBoolean(reader["IsBlocked"]),
                        Group = Convert.ToChar(reader["Group"]),
                        IsActive = Convert.ToBoolean(reader["IsActive"])

                    });
                }

                reader.Close();
            }
            catch (Exception ex)
            {
                throw new Exception("Error fetching users: " + ex.Message);
            }
            finally
            {
                con?.Close();
            }

            return users;
        }
        public bool SetUserBlockedStatus(int userId, bool isBlocked)
        {
            SqlConnection con = null;
            try
            {
                con = Connect("myProjDB");

                Dictionary<string, object> parameters = new Dictionary<string, object>
        {
            { "@UserId", userId },
            { "@IsBlocked", isBlocked }
        };

                SqlCommand cmd = CreateCommandWithStoredProcedure("sp_SetUserBlockedStatus", con, parameters);
                cmd.ExecuteNonQuery();

                return true; // Assume success unless an exception is thrown
            }
            catch (Exception ex)
            {
                throw new Exception("Error updating block status: " + ex.Message);
            }
            finally
            {
                con?.Close();
            }
        }

        public bool LogoutUser(int userId)
        {
            SqlConnection con = null;
            try
            {
                con = Connect("myProjDB");

                var parameters = new Dictionary<string, object>
        {
            { "@UserId", userId }
        };

                SqlCommand cmd = CreateCommandWithStoredProcedure("sp_LogoutUser", con, parameters);
                cmd.ExecuteNonQuery();

                return true; // לא נבדוק rowsAffected, כי זה עלול להיות 0 גם אם הצליח
            }
            catch (Exception ex)
            {
                Console.WriteLine("Logout error: " + ex.Message);
                return false;
            }
            finally
            {
                con?.Close();
            }
        }

        public bool UpdateUserRole(int userId, string newRole)
        {
            SqlConnection con = null;
            try
            {
                con = Connect("myProjDB");

                Dictionary<string, object> parameters = new Dictionary<string, object>
        {
            { "@UserId", userId },
            { "@NewRole", newRole }
        };

                SqlCommand cmd = CreateCommandWithStoredProcedure("sp_UpdateUserRole", con, parameters);
                cmd.ExecuteNonQuery(); // Don't check result if SET NOCOUNT ON
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Exception in UpdateUserRole: " + ex.Message);
                return false;
            }
            finally
            {
                con?.Close();
            }
        }
        public List<User> GetUsersByGroup(char groupName)
        {
            SqlConnection con = null;
            List<User> users = new List<User>();

            try
            {
                con = Connect("myProjDB");

                var parameters = new Dictionary<string, object>
        {
            { "@GroupName", groupName }
        };

                SqlCommand cmd = CreateCommandWithStoredProcedure("GetUsersByGroup", con, parameters);
                SqlDataReader reader = cmd.ExecuteReader();

                while (reader.Read())
                {
                    users.Add(new User
                    {
                        Id = Convert.ToInt32(reader["Id"]),
                        Username = reader["Username"].ToString(),
                        Email = reader["Email"].ToString(),
                        Role = reader["Role"].ToString(),
                        CreatedAt = Convert.ToDateTime(reader["CreatedAt"]),
                        IsBlocked = Convert.ToBoolean(reader["IsBlocked"]),
                        Group = Convert.ToChar(reader["Group"]),
                        IsActive = Convert.ToBoolean(reader["IsActive"])
                    });
                }

                reader.Close();
            }
            catch (Exception ex)
            {
                throw new Exception("Error fetching users by group: " + ex.Message);
            }
            finally
            {
                con?.Close();
            }

            return users;
        }

        public bool ChangeUserGroup(int userId, char newGroup)
        {
            SqlConnection con = null;
            try
            {
                con = Connect("myProjDB");

                var parameters = new Dictionary<string, object>
        {
            { "@UserId", userId },
            { "@NewGroup", newGroup }
        };

                SqlCommand cmd = CreateCommandWithStoredProcedure("ChangeUserGroup", con, parameters);
                int rowsAffected = cmd.ExecuteNonQuery();

                return rowsAffected > 0;
            }
            catch (Exception ex)
            {
                throw new Exception("Error updating user group: " + ex.Message);
            }
            finally
            {
                con?.Close();
            }
        }
        public void AddRadioChannel(RadioChannel channel)
        {
            SqlConnection con = null;
            try
            {
                con = Connect("myProjDB");

                Dictionary<string, object> parameters = new Dictionary<string, object>
        {
            { "@Name", channel.Name },
            { "@Frequency", channel.Frequency },
            { "@Status", "Active" },
            { "@Mode", channel.Mode },
            { "@ChannelState", "Idle" }
        };

                SqlCommand cmd = CreateCommandWithStoredProcedure("sp_AddRadioChannel", con, parameters);
                cmd.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                throw new Exception("Error adding radio channel: " + ex.Message);
            }
            finally
            {
                con?.Close();
            }
        }
        public void DeleteRadioChannel(int channelId)
        {
            SqlConnection con = null;
            try
            {
                con = Connect("myProjDB");

                Dictionary<string, object> parameters = new Dictionary<string, object>
        {
            { "@ChannelId", channelId }
        };

                SqlCommand cmd = CreateCommandWithStoredProcedure("sp_DeleteRadioChannel", con, parameters);
                cmd.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                throw new Exception("Error deleting radio channel: " + ex.Message);
            }
            finally
            {
                con?.Close();
            }
        }
        public void AddUserChannel(int userId, int channelId)
        {
            SqlConnection con = null;
            try
            {
                con = Connect("myProjDB");

                Dictionary<string, object> parameters = new Dictionary<string, object>
        {
            { "@UserId", userId },
            { "@ChannelId", channelId }
        };

                SqlCommand cmd = CreateCommandWithStoredProcedure("sp_AddUserChannel", con, parameters);
                cmd.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                throw new Exception("Error adding user channel: " + ex.Message);
            }
            finally
            {
                con?.Close();
            }
        }
        public void RemoveUserChannel(int userId, int channelId)
        {
            SqlConnection con = null;
            try
            {
                con = Connect("myProjDB");

                Dictionary<string, object> parameters = new Dictionary<string, object>
        {
            { "@UserId", userId },
            { "@ChannelId", channelId }
        };

                SqlCommand cmd = CreateCommandWithStoredProcedure("sp_RemoveUserChannel", con, parameters);
                cmd.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                throw new Exception("Error removing user channel: " + ex.Message);
            }
            finally
            {
                con?.Close();
            }
        }

        //announcements

        public bool AddAnnouncement(string title, string content, string userName)
        {
            SqlConnection con = null;
            try
            {
                con = Connect("myProjDB");
                var parameters = new Dictionary<string, object>
        {
            { "@Title", title },
            { "@Content", content },
            { "@UserName", userName }
        };

                SqlCommand cmd = CreateCommandWithStoredProcedure("sp_AddAnnouncement", con, parameters);
                cmd.ExecuteNonQuery();
                return true;
            }
            catch (Exception ex)
            {
                throw new Exception("Error adding announcement: " + ex.Message);
            }
            finally
            {
                con?.Close();
            }
        }

        public List<Announcement> GetAllAnnouncements()
        {
            SqlConnection con = null;
            List<Announcement> announcements = new List<Announcement>();

            try
            {
                con = Connect("myProjDB");
                SqlCommand cmd = CreateCommandWithStoredProcedure("sp_GetAllAnnouncements", con, null);
                SqlDataReader reader = cmd.ExecuteReader();

                while (reader.Read())
                {
                    announcements.Add(new Announcement
                    {
                        Id = Convert.ToInt32(reader["Id"]),
                        Title = reader["Title"].ToString(),
                        Content = reader["Content"].ToString(),
                        UserName = reader["UserName"].ToString(),
                        CreatedAt = Convert.ToDateTime(reader["CreatedAt"])
                    });
                }

                reader.Close();
            }
            catch (Exception ex)
            {
                throw new Exception("Error fetching announcements: " + ex.Message);
            }
            finally
            {
                con?.Close();
            }

            return announcements;
        }

        // מתודה להחזרת הודעות עם סטטוס קריאה
        public List<Announcement> GetAllAnnouncementsWithReadStatus(int userId)
        {
            SqlConnection con = null;
            List<Announcement> announcements = new List<Announcement>();
            try
            {
                con = Connect("myProjDB");
                var parameters = new Dictionary<string, object>
        {
            { "@UserId", userId }
        };
                SqlCommand cmd = CreateCommandWithStoredProcedure("sp_GetAllAnnouncementsWithReadStatus", con, parameters);
                SqlDataReader reader = cmd.ExecuteReader();
                while (reader.Read())
                {
                    announcements.Add(new Announcement
                    {
                        Id = Convert.ToInt32(reader["Id"]),
                        Title = reader["Title"].ToString(),
                        Content = reader["Content"].ToString(),
                        UserName = reader["UserName"].ToString(),
                        CreatedAt = Convert.ToDateTime(reader["CreatedAt"]),
                        IsRead = Convert.ToBoolean(reader["IsRead"]) // קריאת השדה החדש
                    });
                }
                reader.Close();
            }
            catch (Exception ex)
            {
                throw new Exception("Error fetching announcements with read status: " + ex.Message);
            }
            finally
            {
                con?.Close();
            }
            return announcements;
        }

        // מתודה לסימון כל ההודעות כנקראות
        public bool MarkAllAnnouncementsAsRead(int userId)
        {
            SqlConnection con = null;
            try
            {
                con = Connect("myProjDB");
                var parameters = new Dictionary<string, object>
        {
            { "@UserId", userId }
        };
                SqlCommand cmd = CreateCommandWithStoredProcedure("sp_MarkAllAnnouncementsAsRead", con, parameters);
                cmd.ExecuteNonQuery();
                return true;
            }
            catch (Exception ex)
            {
                throw new Exception("Error marking announcements as read: " + ex.Message);
            }
            finally
            {
                con?.Close();
            }
        }

        // מתודה לקבלת מספר ההודעות שלא נקראו
        public int GetUnreadAnnouncementsCount(int userId)
        {
            SqlConnection con = null;
            int count = 0;
            try
            {
                con = Connect("myProjDB");
                var parameters = new Dictionary<string, object>
        {
            { "@UserId", userId }
        };
                SqlCommand cmd = CreateCommandWithStoredProcedure("sp_GetUnreadAnnouncementsCount", con, parameters);
                object result = cmd.ExecuteScalar();
                if (result != null && result != DBNull.Value)
                {
                    count = Convert.ToInt32(result);
                }
            }
            catch (Exception ex)
            {
                throw new Exception("Error getting unread announcements count: " + ex.Message);
            }
            finally
            {
                con?.Close();
            }
            return count;
        }

        // ================================================
        // Private Calls Methods
        // ================================================

        // 1. Send private call invitation
        public SendCallInvitationResponse SendPrivateCallInvitation(int callerId, int receiverId)
        {
            SqlConnection con = null;
            try
            {
                con = Connect("myProjDB");

                var parameters = new Dictionary<string, object>
                {
                    { "@CallerId", callerId },
                    { "@ReceiverId", receiverId }
                };

                SqlCommand cmd = CreateCommandWithStoredProcedure("SP_SendPrivateCallInvitation", con, parameters);
                
                // הוספת OUTPUT parameter
                SqlParameter outputParam = new SqlParameter("@InvitationId", SqlDbType.NVarChar, 50);
                outputParam.Direction = ParameterDirection.Output;
                cmd.Parameters.Add(outputParam);

                SqlDataReader reader = cmd.ExecuteReader();
                
                if (reader.Read())
                {
                    return new SendCallInvitationResponse
                    {
                        InvitationId = reader["InvitationId"].ToString(),
                        ChannelName = reader["ChannelName"].ToString(),
                        Message = reader["Message"].ToString(),
                        Success = true
                    };
                }

                return new SendCallInvitationResponse
                {
                    Success = false,
                    Message = "Failed to send invitation"
                };
            }
            catch (Exception ex)
            {
                return new SendCallInvitationResponse
                {
                    Success = false,
                    Message = "Error sending invitation: " + ex.Message
                };
            }
            finally
            {
                con?.Close();
            }
        }

        // 2. Get incoming calls for user
        public GetIncomingCallsResponse GetIncomingCalls(int userId)
        {
            SqlConnection con = null;
            try
            {
                con = Connect("myProjDB");

                var parameters = new Dictionary<string, object>
                {
                    { "@UserId", userId }
                };

                SqlCommand cmd = CreateCommandWithStoredProcedure("SP_GetIncomingCalls", con, parameters);
                SqlDataReader reader = cmd.ExecuteReader();

                var incomingCalls = new List<IncomingCallInvitation>();

                while (reader.Read())
                {
                    incomingCalls.Add(new IncomingCallInvitation
                    {
                        Id = reader["Id"].ToString(),
                        CallerId = Convert.ToInt32(reader["CallerId"]),
                        CallerName = reader["CallerName"].ToString(),
                        CallerEmail = reader["CallerEmail"].ToString(),
                        CallerRole = reader["CallerRole"].ToString(),
                        ChannelName = reader["ChannelName"].ToString(),
                        Timestamp = Convert.ToDateTime(reader["Timestamp"]),
                        ExpiresAt = Convert.ToDateTime(reader["ExpiresAt"]),
                        Status = reader["Status"].ToString()
                    });
                }

                reader.Close();

                return new GetIncomingCallsResponse
                {
                    IncomingCalls = incomingCalls,
                    Count = incomingCalls.Count,
                    Success = true
                };
            }
            catch (Exception ex)
            {
                return new GetIncomingCallsResponse
                {
                    IncomingCalls = new List<IncomingCallInvitation>(),
                    Count = 0,
                    Success = false
                };
            }
            finally
            {
                con?.Close();
            }
        }

        // 3. Accept call invitation
        public AcceptCallInvitationResponse AcceptCallInvitation(string invitationId, int userId)
        {
            SqlConnection con = null;
            try
            {
                con = Connect("myProjDB");

                var parameters = new Dictionary<string, object>
                {
                    { "@InvitationId", invitationId },
                    { "@UserId", userId }
                };

                SqlCommand cmd = CreateCommandWithStoredProcedure("SP_AcceptCallInvitation", con, parameters);
                SqlDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                {
                    return new AcceptCallInvitationResponse
                    {
                        InvitationId = reader["InvitationId"].ToString(),
                        ChannelName = reader["ChannelName"].ToString(),
                        Message = reader["Message"].ToString(),
                        Status = reader["Status"].ToString(),
                        Success = true
                    };
                }

                return new AcceptCallInvitationResponse
                {
                    Success = false,
                    Message = "Failed to accept invitation"
                };
            }
            catch (Exception ex)
            {
                return new AcceptCallInvitationResponse
                {
                    Success = false,
                    Message = "Error accepting invitation: " + ex.Message
                };
            }
            finally
            {
                con?.Close();
            }
        }

        // 4. Reject call invitation
        public RejectCallInvitationResponse RejectCallInvitation(string invitationId, int userId)
        {
            SqlConnection con = null;
            try
            {
                con = Connect("myProjDB");

                var parameters = new Dictionary<string, object>
                {
                    { "@InvitationId", invitationId },
                    { "@UserId", userId }
                };

                SqlCommand cmd = CreateCommandWithStoredProcedure("SP_RejectCallInvitation", con, parameters);
                SqlDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                {
                    return new RejectCallInvitationResponse
                    {
                        InvitationId = reader["InvitationId"].ToString(),
                        Message = reader["Message"].ToString(),
                        Status = reader["Status"].ToString(),
                        Success = true
                    };
                }

                return new RejectCallInvitationResponse
                {
                    Success = false,
                    Message = "Failed to reject invitation"
                };
            }
            catch (Exception ex)
            {
                return new RejectCallInvitationResponse
                {
                    Success = false,
                    Message = "Error rejecting invitation: " + ex.Message
                };
            }
            finally
            {
                con?.Close();
            }
        }

        // 5. Cancel call invitation
        public CancelCallInvitationResponse CancelCallInvitation(string invitationId, int userId)
        {
            SqlConnection con = null;
            try
            {
                con = Connect("myProjDB");

                var parameters = new Dictionary<string, object>
                {
                    { "@InvitationId", invitationId },
                    { "@UserId", userId }
                };

                SqlCommand cmd = CreateCommandWithStoredProcedure("SP_CancelCallInvitation", con, parameters);
                SqlDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                {
                    return new CancelCallInvitationResponse
                    {
                        InvitationId = reader["InvitationId"].ToString(),
                        Message = reader["Message"].ToString(),
                        Status = reader["Status"].ToString(),
                        Success = true
                    };
                }

                return new CancelCallInvitationResponse
                {
                    Success = false,
                    Message = "Failed to cancel invitation"
                };
            }
            catch (Exception ex)
            {
                return new CancelCallInvitationResponse
                {
                    Success = false,
                    Message = "Error cancelling invitation: " + ex.Message
                };
            }
            finally
            {
                con?.Close();
            }
        }

        // 6. Get call status
        public GetCallStatusResponse GetCallStatus(string invitationId, int userId)
        {
            SqlConnection con = null;
            try
            {
                con = Connect("myProjDB");

                var parameters = new Dictionary<string, object>
                {
                    { "@InvitationId", invitationId },
                    { "@UserId", userId }
                };

                SqlCommand cmd = CreateCommandWithStoredProcedure("SP_GetCallStatus", con, parameters);
                SqlDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                {
                    return new GetCallStatusResponse
                    {
                        InvitationId = reader["InvitationId"].ToString(),
                        Status = reader["Status"].ToString(),
                        ChannelName = reader["ChannelName"].ToString(),
                        Timestamp = Convert.ToDateTime(reader["Timestamp"]),
                        UpdatedAt = Convert.ToDateTime(reader["UpdatedAt"]),
                        ExpiresAt = Convert.ToDateTime(reader["ExpiresAt"]),
                        Direction = reader["Direction"].ToString(),
                        Success = true
                    };
                }

                return new GetCallStatusResponse
                {
                    Success = false
                };
            }
            catch (Exception ex)
            {
                return new GetCallStatusResponse
                {
                    Success = false
                };
            }
            finally
            {
                con?.Close();
            }
        }

        // 7. End private call
        public EndCallResponse EndPrivateCall(string invitationId, string endReason = "completed")
        {
            SqlConnection con = null;
            try
            {
                con = Connect("myProjDB");

                var parameters = new Dictionary<string, object>
                {
                    { "@InvitationId", invitationId },
                    { "@EndReason", endReason }
                };

                SqlCommand cmd = CreateCommandWithStoredProcedure("SP_EndPrivateCall", con, parameters);
                SqlDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                {
                    return new EndCallResponse
                    {
                        InvitationId = reader["InvitationId"].ToString(),
                        Message = reader["Message"].ToString(),
                        EndReason = reader["EndReason"].ToString(),
                        Success = true
                    };
                }

                return new EndCallResponse
                {
                    Success = false,
                    Message = "Failed to end call"
                };
            }
            catch (Exception ex)
            {
                return new EndCallResponse
                {
                    Success = false,
                    Message = "Error ending call: " + ex.Message
                };
            }
            finally
            {
                con?.Close();
            }
        }

        // 8. Cleanup old invitations
        public CleanupOldInvitationsResponse CleanupOldInvitations(int daysToKeep = 7)
        {
            SqlConnection con = null;
            try
            {
                con = Connect("myProjDB");

                var parameters = new Dictionary<string, object>
                {
                    { "@DaysToKeep", daysToKeep }
                };

                SqlCommand cmd = CreateCommandWithStoredProcedure("SP_CleanupOldInvitations", con, parameters);
                SqlDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                {
                    return new CleanupOldInvitationsResponse
                    {
                        DeletedInvitations = Convert.ToInt32(reader["DeletedInvitations"]),
                        CutoffDate = Convert.ToDateTime(reader["CutoffDate"]),
                        Message = reader["Message"].ToString(),
                        Success = true
                    };
                }

                return new CleanupOldInvitationsResponse
                {
                    Success = false,
                    Message = "Failed to cleanup old invitations"
                };
            }
            catch (Exception ex)
            {
                return new CleanupOldInvitationsResponse
                {
                    Success = false,
                    Message = "Error cleaning up old invitations: " + ex.Message
                };
            }
            finally
            {
                con?.Close();
            }
        }

        // 9. Get user call statistics
        public GetUserCallStatsResponse GetUserCallStats(int userId, int daysBack = 30)
        {
            SqlConnection con = null;
            try
            {
                con = Connect("myProjDB");

                var parameters = new Dictionary<string, object>
                {
                    { "@UserId", userId },
                    { "@DaysBack", daysBack }
                };

                SqlCommand cmd = CreateCommandWithStoredProcedure("SP_GetUserCallStats", con, parameters);
                SqlDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                {
                    return new GetUserCallStatsResponse
                    {
                        Stats = new UserCallStats
                        {
                            UserId = Convert.ToInt32(reader["UserId"]),
                            Username = reader["Username"].ToString(),
                            CallsMade = Convert.ToInt32(reader["CallsMade"]),
                            CallsReceived = Convert.ToInt32(reader["CallsReceived"]),
                            CallsAccepted = Convert.ToInt32(reader["CallsAccepted"]),
                            CallsRejected = Convert.ToInt32(reader["CallsRejected"]),
                            CallsTimedOut = Convert.ToInt32(reader["CallsTimedOut"]),
                            AvgCallDurationSeconds = reader["AvgCallDurationSeconds"] != DBNull.Value ? 
                                Convert.ToDouble(reader["AvgCallDurationSeconds"]) : (double?)null
                        },
                        Success = true
                    };
                }

                return new GetUserCallStatsResponse
                {
                    Success = false
                };
            }
            catch (Exception ex)
            {
                return new GetUserCallStatsResponse
                {
                    Success = false
                };
            }
            finally
            {
                con?.Close();
            }
        }
    }
}
