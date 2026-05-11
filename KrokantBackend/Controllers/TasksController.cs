using KrokantBackend.Data;
using KrokantBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace KrokantBackend.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly KrokantContext _context;

        public TasksController(KrokantContext context)
        {
            _context = context;
        }

        [HttpPost]
        [Authorize(Roles = "HEAD")]
        public IActionResult Create([FromBody] CreateTaskRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                return BadRequest(new { error = new { code = "BAD_REQUEST", message = "Title required" } });

            if (string.IsNullOrWhiteSpace(request.Description))
                return BadRequest(new { error = new { code = "BAD_REQUEST", message = "Description required" } });

            if (string.IsNullOrWhiteSpace(request.AssigneeId))
                return BadRequest(new { error = new { code = "BAD_REQUEST", message = "Assignee required" } });

            if (!TryParsePriority(request.Priority, out var priority))
                return BadRequest(new { error = new { code = "BAD_REQUEST", message = "Invalid priority" } });

            var assignee = _context.Users.SingleOrDefault(u => u.Id == request.AssigneeId);
            if (assignee == null)
                return NotFound(new { error = new { code = "NOT_FOUND", message = "Assignee not found" } });

            var creator = GetCurrentUser();
            if (creator == null)
                return Unauthorized();

            var now = DateTime.UtcNow;
            var task = new TaskItem
            {
                Id = string.Concat("task_", Guid.NewGuid().ToString("N").AsSpan(0, 8)),
                Title = request.Title,
                Description = request.Description,
                Status = TaskStatus.NEW,
                Priority = priority,
                Deadline = request.Deadline,
                Assignee = assignee,
                CreatedBy = creator,
                CreatedAt = now,
                UpdatedAt = now
            };

            _context.Tasks.Add(task);
            AddActivity(task, creator.FullName, "Task created");
            _context.SaveChanges();

            var savedTask = LoadTaskWithRelations(task.Id);
            return CreatedAtAction(nameof(GetById), new { id = task.Id }, ToDto(savedTask!));
        }

        [HttpGet]
        [Authorize]
        public IActionResult Get(
            [FromQuery] string? status,
            [FromQuery] string? assigneeId,
            [FromQuery] string? search,
            [FromQuery] string? priority,
            [FromQuery] string? sort,
            [FromQuery] int page = 1,
            [FromQuery] int limit = 20)
        {
            if (page < 1 || limit < 1)
                return BadRequest(new { error = new { code = "BAD_REQUEST", message = "Invalid pagination" } });

            var query = _context.Tasks
                .AsNoTracking()
                .Include(t => t.Assignee)
                .Include(t => t.CreatedBy)
                .Include(t => t.Comments)
                .Include(t => t.Activities)
                .AsQueryable();

            var role = User.FindFirstValue(ClaimTypes.Role);
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (role == "TEACHER")
                query = query.Where(t => t.Assignee != null && t.Assignee.Id == userId);

            if (!string.IsNullOrWhiteSpace(status))
            {
                if (!Enum.TryParse<TaskStatus>(status, true, out var parsedStatus))
                    return BadRequest(new { error = new { code = "BAD_REQUEST", message = "Invalid status" } });

                query = query.Where(t => t.Status == parsedStatus);
            }

            if (!string.IsNullOrWhiteSpace(priority))
            {
                if (!TryParsePriority(priority, out var parsedPriority))
                    return BadRequest(new { error = new { code = "BAD_REQUEST", message = "Invalid priority" } });

                query = query.Where(t => t.Priority == parsedPriority);
            }

            if (!string.IsNullOrWhiteSpace(assigneeId))
                query = query.Where(t => t.Assignee != null && t.Assignee.Id == assigneeId);

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(t => t.Title.Contains(search) || t.Description.Contains(search));

            var sortedQuery = sort switch
            {
                "deadline_asc" => query
                    .OrderBy(t => t.Deadline == null)
                    .ThenBy(t => t.Deadline)
                    .ThenByDescending(t => t.UpdatedAt),
                "deadline_desc" => query
                    .OrderByDescending(t => t.Deadline)
                    .ThenByDescending(t => t.UpdatedAt),
                "priority" => query
                    .OrderByDescending(t => t.Priority)
                    .ThenBy(t => t.Deadline == null)
                    .ThenBy(t => t.Deadline),
                "created" => query.OrderByDescending(t => t.CreatedAt),
                _ => query.OrderByDescending(t => t.UpdatedAt)
            };

            var total = sortedQuery.Count();

            var items = sortedQuery
                .Skip((page - 1) * limit)
                .Take(limit)
                .AsEnumerable()
                .Select(ToDto)
                .ToList();

            return Ok(new { items, page, limit, total });
        }

        [HttpGet("upcoming")]
        [Authorize]
        public IActionResult GetUpcoming([FromQuery] int days = 7)
        {
            if (days < 1 || days > 365)
                return BadRequest(new { error = new { code = "BAD_REQUEST", message = "Invalid range" } });

            var start = DateTime.UtcNow.Date;
            var endExclusive = start.AddDays(days + 1);

            var query = _context.Tasks
                .AsNoTracking()
                .Include(t => t.Assignee)
                .Include(t => t.CreatedBy)
                .Include(t => t.Comments)
                .Include(t => t.Activities)
                .Where(t =>
                    t.Deadline.HasValue &&
                    t.Deadline.Value >= start &&
                    t.Deadline.Value < endExclusive &&
                    t.Status != TaskStatus.DONE);

            var role = User.FindFirstValue(ClaimTypes.Role);
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (role == "TEACHER")
                query = query.Where(t => t.Assignee != null && t.Assignee.Id == userId);

            var items = query
                .OrderBy(t => t.Deadline)
                .Take(50)
                .AsEnumerable()
                .Select(ToDto)
                .ToList();

            return Ok(items);
        }

        [HttpGet("{id}")]
        [Authorize]
        public IActionResult GetById(string id)
        {
            var task = LoadTaskWithRelations(id);
            if (task == null)
                return NotFound(new { error = new { code = "NOT_FOUND", message = "Task not found" } });

            if (IsTeacherAndNotAssignee(task))
                return Forbid();

            return Ok(ToDto(task));
        }

        [HttpPatch("{id}")]
        [Authorize(Roles = "HEAD")]
        public IActionResult Update(string id, [FromBody] UpdateTaskRequest req)
        {
            var task = LoadTaskWithRelations(id);
            if (task == null)
                return NotFound(new { error = new { code = "NOT_FOUND", message = "Task not found" } });

            if (!string.IsNullOrWhiteSpace(req.Title))
                task.Title = req.Title;

            if (!string.IsNullOrWhiteSpace(req.Description))
                task.Description = req.Description;

            if (!string.IsNullOrWhiteSpace(req.AssigneeId))
            {
                var assignee = _context.Users.SingleOrDefault(u => u.Id == req.AssigneeId);

                if (assignee == null)
                    return NotFound(new { error = new { code = "NOT_FOUND", message = "Assignee not found" } });

                task.Assignee = assignee;
            }

            if (req.Deadline.HasValue)
                task.Deadline = req.Deadline.Value;

            if (!string.IsNullOrWhiteSpace(req.Priority))
            {
                if (!TryParsePriority(req.Priority, out var updatedPriority))
                    return BadRequest(new { error = new { code = "BAD_REQUEST", message = "Invalid priority" } });

                task.Priority = updatedPriority;
            }

            task.UpdatedAt = DateTime.UtcNow;
            AddActivity(task, GetCurrentUserName(), "Task updated");
            _context.SaveChanges();

            return Ok(ToDto(task));
        }

        [HttpPatch("{id}/status")]
        [Authorize]
        public IActionResult ChangeStatus(string id, [FromBody] StatusChangeRequest req)
        {
            var task = LoadTaskWithRelations(id);
            if (task == null)
                return NotFound(new { error = new { code = "NOT_FOUND", message = "Task not found" } });

            if (IsTeacherAndNotAssignee(task))
                return Forbid();

            if (!Enum.TryParse<TaskStatus>(req.Status, true, out var newStatus))
                return BadRequest(new { error = new { code = "BAD_REQUEST", message = "Invalid status" } });

            if (newStatus == TaskStatus.IN_PROGRESS &&
                task.Status != TaskStatus.NEW &&
                task.Status != TaskStatus.IN_PROGRESS)
            {
                return BadRequest(new { error = new { code = "BAD_REQUEST", message = "Invalid transition" } });
            }

            if (newStatus == TaskStatus.DONE && task.Status == TaskStatus.DONE)
                return BadRequest(new { error = new { code = "BAD_REQUEST", message = "Already DONE" } });

            task.Status = newStatus;
            task.UpdatedAt = DateTime.UtcNow;
            AddActivity(task, GetCurrentUserName(), $"Status changed to {newStatus}");
            _context.SaveChanges();

            return Ok(new
            {
                id = task.Id,
                status = task.Status.ToString(),
                updatedAt = task.UpdatedAt.ToString("o")
            });
        }

        [HttpPatch("{id}/deadline")]
        [Authorize]
        public IActionResult ChangeDeadline(string id, [FromBody] DeadlineChangeRequest req)
        {
            var task = LoadTaskWithRelations(id);
            if (task == null)
                return NotFound(new { error = new { code = "NOT_FOUND", message = "Task not found" } });

            if (IsTeacherAndNotAssignee(task))
                return Forbid();

            if (!req.Deadline.HasValue)
                return BadRequest(new { error = new { code = "BAD_REQUEST", message = "Deadline required" } });

            task.Deadline = req.Deadline.Value;
            task.UpdatedAt = DateTime.UtcNow;
            AddActivity(task, GetCurrentUserName(), "Deadline changed");
            _context.SaveChanges();

            return Ok(new
            {
                id = task.Id,
                deadline = task.Deadline?.ToString("yyyy-MM-dd"),
                updatedAt = task.UpdatedAt.ToString("o")
            });
        }

        [HttpPost("{id}/comments")]
        [Authorize]
        public IActionResult AddComment(string id, [FromBody] AddCommentRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Text))
                return BadRequest(new { error = new { code = "BAD_REQUEST", message = "Comment text required" } });

            var task = LoadTaskWithRelations(id);
            if (task == null)
                return NotFound(new { error = new { code = "NOT_FOUND", message = "Task not found" } });

            if (IsTeacherAndNotAssignee(task))
                return Forbid();

            var author = GetCurrentUser();
            if (author == null)
                return Unauthorized();

            var comment = new TaskComment
            {
                Id = string.Concat("comment_", Guid.NewGuid().ToString("N").AsSpan(0, 8)),
                TaskId = task.Id,
                AuthorId = author.Id,
                AuthorName = author.FullName,
                Text = req.Text.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            task.Comments.Add(comment);
            task.UpdatedAt = DateTime.UtcNow;
            AddActivity(task, author.FullName, "Comment added");
            _context.SaveChanges();

            return Ok(ToCommentDto(comment));
        }

        private TaskItem? LoadTaskWithRelations(string id) =>
            _context.Tasks
                .Include(t => t.Assignee)
                .Include(t => t.CreatedBy)
                .Include(t => t.Comments)
                .Include(t => t.Activities)
                .SingleOrDefault(t => t.Id == id);

        private bool IsTeacherAndNotAssignee(TaskItem task)
        {
            var role = User.FindFirstValue(ClaimTypes.Role);
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return role == "TEACHER" && task.Assignee?.Id != userId;
        }

        private User? GetCurrentUser()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrWhiteSpace(userId))
                return null;

            return _context.Users.SingleOrDefault(u => u.Id == userId);
        }

        private string GetCurrentUserName() => GetCurrentUser()?.FullName ?? "System";

        private void AddActivity(TaskItem task, string actorName, string action)
        {
            task.Activities.Add(new TaskActivity
            {
                Id = string.Concat("activity_", Guid.NewGuid().ToString("N").AsSpan(0, 8)),
                TaskId = task.Id,
                ActorName = actorName,
                Action = action,
                CreatedAt = DateTime.UtcNow
            });
        }

        private static bool TryParsePriority(string? value, out TaskPriority priority)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                priority = TaskPriority.MEDIUM;
                return true;
            }

            return Enum.TryParse(value, true, out priority);
        }

        private object ToDto(TaskItem t) => new
        {
            id = t.Id,
            title = t.Title,
            description = t.Description,
            status = t.Status.ToString(),
            priority = t.Priority.ToString(),
            deadline = t.Deadline?.ToString("yyyy-MM-dd"),
            assigneeId = t.Assignee?.Id ?? string.Empty,
            assigneeName = t.Assignee?.FullName ?? "Unassigned",
            createdById = t.CreatedBy?.Id ?? string.Empty,
            createdByName = t.CreatedBy?.FullName ?? "Unknown",
            createdAt = t.CreatedAt.ToString("o"),
            updatedAt = t.UpdatedAt.ToString("o"),
            comments = t.Comments
                .OrderBy(c => c.CreatedAt)
                .Select(ToCommentDto)
                .ToList(),
            activity = t.Activities
                .OrderBy(a => a.CreatedAt)
                .Select(ToActivityDto)
                .ToList()
        };

        private static object ToCommentDto(TaskComment c) => new
        {
            id = c.Id,
            authorId = c.AuthorId,
            authorName = c.AuthorName,
            text = c.Text,
            createdAt = c.CreatedAt.ToString("o")
        };

        private static object ToActivityDto(TaskActivity a) => new
        {
            id = a.Id,
            actorName = a.ActorName,
            action = a.Action,
            createdAt = a.CreatedAt.ToString("o")
        };
    }

    public record CreateTaskRequest(string Title, string Description, string? AssigneeId, DateTime? Deadline, string? Priority);

    public record UpdateTaskRequest(string? Title, string? Description, string? AssigneeId, DateTime? Deadline, string? Priority);

    public record StatusChangeRequest(string Status);

    public record DeadlineChangeRequest(DateTime? Deadline, string? Comment);

    public record AddCommentRequest(string Text);
}
