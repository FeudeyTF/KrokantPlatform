namespace KrokantBackend.Models
{
    public enum UserRole
    {
        HEAD,
        TEACHER
    }

    public class User
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;

        public UserRole Role { get; set; }
    }
}
