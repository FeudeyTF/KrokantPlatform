using KrokantBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace KrokantBackend.Data
{
    public class KrokantContext : DbContext
    {
        public DbSet<User> Users { get; set; }

        public DbSet<TaskItem> Tasks { get; set; }

        public DbSet<TaskComment> TaskComments { get; set; }

        public DbSet<TaskActivity> TaskActivities { get; set; }

        public KrokantContext(DbContextOptions<KrokantContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>().HasKey(u => u.Id);
            modelBuilder.Entity<TaskItem>().HasKey(t => t.Id);
            modelBuilder.Entity<TaskComment>().HasKey(c => c.Id);
            modelBuilder.Entity<TaskActivity>().HasKey(a => a.Id);

            modelBuilder.Entity<TaskItem>()
                .Property(t => t.Priority)
                .HasDefaultValue(TaskPriority.MEDIUM);

            modelBuilder.Entity<TaskItem>()
                .HasMany(t => t.Comments)
                .WithOne(c => c.Task)
                .HasForeignKey(c => c.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskItem>()
                .HasMany(t => t.Activities)
                .WithOne(a => a.Task)
                .HasForeignKey(a => a.TaskId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }

    public static class DbSeeder
    {
        public static void Seed(KrokantContext db)
        {
            if (db.Users.Any())
                return;

            User head = new() { Id = "u1", FullName = "Иван", Email = "head@spbstu.ru", Password = "123456", Role = UserRole.HEAD };
            User t1 = new() { Id = "t1", FullName = "Анна", Email = "anna@spbstu.ru", Password = "pass1", Role = UserRole.TEACHER };
            User t2 = new() { Id = "t2", FullName = "Олег", Email = "oleg@spbstu.ru", Password = "pass2", Role = UserRole.TEACHER };

            db.Users.AddRange(head, t1, t2);

            var task1 = new TaskItem
            {
                Id = "task_1",
                Title = "Организация практики",
                Description = "Согласовать практику",
                Status = TaskStatus.IN_PROGRESS,
                Priority = TaskPriority.HIGH,
                Deadline = DateTime.Parse("2026-05-10"),
                Assignee = t1,
                CreatedBy = head,
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            };

            db.Tasks.Add(task1);
            db.TaskActivities.Add(new TaskActivity
            {
                Id = "activity_1",
                Task = task1,
                ActorName = head.FullName,
                Action = "Task created",
                CreatedAt = task1.CreatedAt
            });
            db.SaveChanges();
        }
    }
}
