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
                        Mode = reader["Mode"].ToString()
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
    }
}
