namespace KrokantBackend.Models
{
    public enum TaskStatus
    {
        NEW,
        IN_PROGRESS,
        DONE,
        OVERDUE
    }

    public enum TaskPriority
    {
        LOW = 1,
        MEDIUM = 2,
        HIGH = 3
    }

    public class TaskItem
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public TaskStatus Status { get; set; } = TaskStatus.NEW;

        public TaskPriority Priority { get; set; } = TaskPriority.MEDIUM;

        public DateTime? Deadline { get; set; }

        public User Assignee { get; set; } = null!;

        public User CreatedBy { get; set; } = null!;

        public ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>();

        public ICollection<TaskActivity> Activities { get; set; } = new List<TaskActivity>();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
