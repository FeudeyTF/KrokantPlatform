using KrokantBackend.Models;
using Microsoft.EntityFrameworkCore;

namespace KrokantBackend.Data
{
    public class KrokantContext : DbContext
    {
        public DbSet<User> Users { get; set; }

        public DbSet<TaskItem> Tasks { get; set; }

        public KrokantContext(DbContextOptions<KrokantContext> options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>().HasKey(u => u.Id);
            modelBuilder.Entity<TaskItem>().HasKey(t => t.Id);
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
                Deadline = DateTime.Parse("2026-05-10"),
                Assignee = t1,
                CreatedBy = head,
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                UpdatedAt = DateTime.UtcNow.AddDays(-1)
            };

            db.Tasks.Add(task1);
            db.SaveChanges();
        }
    }
}