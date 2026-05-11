namespace KrokantBackend.Models
{
    public class TaskActivity
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string TaskId { get; set; } = string.Empty;

        public TaskItem Task { get; set; } = null!;

        public string ActorName { get; set; } = string.Empty;

        public string Action { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
