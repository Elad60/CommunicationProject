namespace CommunicationServer.BL
{
    public class Announcement
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string UserName { get; set; }
        public DateTime CreatedAt { get; set; }

        public bool IsRead { get; set; }
    }

}
