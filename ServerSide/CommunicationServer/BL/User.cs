namespace CommunicationServer.BL
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
        public DateTime CreatedAt { get; set; } 
        public bool IsBlocked { get; set; }
        public char Group { get; set; }

    }
}
