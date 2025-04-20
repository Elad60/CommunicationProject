namespace CommunicationServer.BL
{
    public class LoginResponse
    {
        public bool Success { get; set; }
        public string ErrorCode { get; set; }
        public string Message { get; set; }
        public User User { get; set; }
    }

}
