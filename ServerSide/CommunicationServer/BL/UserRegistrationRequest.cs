﻿namespace CommunicationServer.BL
{
    public class UserRegistrationRequest
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }

        public char Group { get; set; }
    }
}
