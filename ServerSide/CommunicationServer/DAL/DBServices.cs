﻿using CommunicationServer.BL;
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
        public User LoginUser(string username, string password)
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
                    return new User
                    {
                        Id = Convert.ToInt32(reader["Id"]),
                        Username = reader["Username"].ToString(),
                        Email = reader["Email"].ToString(),
                        Role = reader["Role"].ToString(),
                        Group = Convert.ToChar(reader["Group"]),
                    };
                }

                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Login error: " + ex.Message);
                return null;
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
                        Group = Convert.ToChar(reader["Group"])
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
                        Group = Convert.ToChar(reader["Group"])
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





    }
}
