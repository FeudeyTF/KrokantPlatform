namespace KrokantBackend.Models
{
    public class TaskComment
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string TaskId { get; set; } = string.Empty;

        public TaskItem Task { get; set; } = null!;

        public string AuthorId { get; set; } = string.Empty;

        public string AuthorName { get; set; } = string.Empty;

        public string Text { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
