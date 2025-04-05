namespace CommunicationServer.BL
{
    public class UpdateUserRoleRequest
    {
        public int UserId { get; set; }
        public string NewRole { get; set; } // Only: "Operator", "Technician", "Admin"
    }
}
