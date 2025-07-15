namespace CommunicationServer.BL
{
    public class RadioChannel
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Frequency { get; set; }
        public string Status { get; set; }  // Active/Inactive
        public string Mode { get; set; }
        public string ChannelState { get; set; }  // Idle, ListenOnly, ListenAndTalk
        public string? PinCodeHash { get; set; } // nullable, for Private rooms
        public string? PinCode { get; set; } // not mapped to DB, for creation only
    }
}
