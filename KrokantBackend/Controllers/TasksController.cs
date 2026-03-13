using KrokantBackend.Data;
using KrokantBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
            var assignee = _context.Users.SingleOrDefault(u => u.Id == request.AssigneeId);
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
            var userName = User.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
            var user = _context.Users.SingleOrDefault(u => u.Id == request.AssigneeId);

            if (user == null || assignee == null)
                return NotFound();

            var task = new TaskItem
            {
                Id = string.Concat("task_", Guid.NewGuid().ToString("N").AsSpan(0, 8)),
                Title = request.Title,
                Description = request.Description,
                Status = TaskStatus.NEW,
                Deadline = request.Deadline,
                Assignee = assignee,
                CreatedBy = user,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Tasks.Add(task);
            _context.SaveChanges();

            return CreatedAtAction(nameof(GetById), new { id = task.Id }, ToDto(task));
        }

        [HttpGet]
        [Authorize]
        public IActionResult Get([FromQuery] string? status, [FromQuery] string? assigneeId, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int limit = 20)
        {
            var query = _context.Tasks.AsQueryable();

            var role = User.FindFirstValue(ClaimTypes.Role);
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (role == "TEACHER")
                query = query.Where(t => t.Assignee.Id == userId);

            if (!string.IsNullOrEmpty(status) && Enum.TryParse<TaskStatus>(status, out var st))
                query = query.Where(t => t.Status == st);

            if (!string.IsNullOrEmpty(assigneeId))
                query = query.Where(t => t.Assignee.Id == assigneeId);

            if (!string.IsNullOrEmpty(search))
                query = query.Where(t => t.Title.Contains(search) || t.Description.Contains(search));

            var total = query.Count();
            var items = query.OrderByDescending(t => t.UpdatedAt).Skip((page - 1) * limit).Take(limit).Select(ToDto);

            return Ok(new { items, page, limit, total });
        }

        [HttpGet("{id}")]
        [Authorize]
        public IActionResult GetById(string id)
        {
            var task = _context.Tasks.SingleOrDefault(t => t.Id == id);
            if (task == null)
                return NotFound(new { error = new { code = "NOT_FOUND", message = "Task not found" } });

            var role = User.FindFirstValue(ClaimTypes.Role);
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (role == "TEACHER" && task.Assignee.Id != userId)
                return Forbid();

            return Ok(ToDto(task));
        }

        [HttpPatch("{id}")]
        [Authorize(Roles = "HEAD")]
        public IActionResult Update(string id, [FromBody] UpdateTaskRequest req)
        {
            var task = _context.Tasks.SingleOrDefault(t => t.Id == id);
            if (task == null)
                return NotFound(new { error = new { code = "NOT_FOUND", message = "Task not found" } });

            if (!string.IsNullOrEmpty(req.Title))
                task.Title = req.Title;

            if (!string.IsNullOrEmpty(req.Description))
                task.Description = req.Description;

            if (!string.IsNullOrEmpty(req.AssigneeId))
            {
                var assignee = _context.Users.SingleOrDefault(u => u.Id == req.AssigneeId);
                if(assignee == null)
                    return NotFound();
                task.Assignee = assignee;
            }

            if (req.Deadline.HasValue)
                task.Deadline = req.Deadline.Value;

            task.UpdatedAt = DateTime.UtcNow;
            _context.SaveChanges();

            return Ok(ToDto(task));
        }

        [HttpPatch("{id}/status")]
        [Authorize]
        public IActionResult ChangeStatus(string id, [FromBody] StatusChangeRequest req)
        {
            var task = _context.Tasks.SingleOrDefault(t => t.Id == id);
            if (task == null)
                return NotFound(new { error = new { code = "NOT_FOUND", message = "Task not found" } });

            var role = User.FindFirstValue(ClaimTypes.Role);
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (role == "TEACHER" && task.Assignee.Id != userId)
                return Forbid();

            if (!Enum.TryParse<TaskStatus>(req.Status, out var newStatus))
                return BadRequest(new { error = new { code = "BAD_REQUEST", message = "Invalid status" } });

            if (newStatus == TaskStatus.IN_PROGRESS && task.Status != TaskStatus.NEW && task.Status != TaskStatus.IN_PROGRESS)
                return BadRequest(new { error = new { code = "BAD_REQUEST", message = "Invalid transition" } });

            if (newStatus == TaskStatus.DONE && task.Status == TaskStatus.DONE)
                return BadRequest(new { error = new { code = "BAD_REQUEST", message = "Already DONE" } });

            task.Status = newStatus;
            task.UpdatedAt = DateTime.UtcNow;
            _context.SaveChanges();

            return Ok(new { id = task.Id, status = task.Status.ToString(), updatedAt = task.UpdatedAt.ToString("o") });
        }

        [HttpPatch("{id}/deadline")]
        [Authorize]
        public IActionResult ChangeDeadline(string id, [FromBody] DeadlineChangeRequest req)
        {
            var task = _context.Tasks.SingleOrDefault(t => t.Id == id);
            if (task == null) return NotFound(new { error = new { code = "NOT_FOUND", message = "Task not found" } });

            var role = User.FindFirstValue(ClaimTypes.Role);
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (role == "TEACHER" && task.Assignee.Id != userId)
                return Forbid();

            if (!req.Deadline.HasValue)
                return BadRequest(new { error = new { code = "BAD_REQUEST", message = "Deadline required" } });

            task.Deadline = req.Deadline.Value;
            task.UpdatedAt = DateTime.UtcNow;
            _context.SaveChanges();

            return Ok(new { id = task.Id, deadline = task.Deadline?.ToString("yyyy-MM-dd"), updatedAt = task.UpdatedAt.ToString("o") });
        }

        private static object ToDto(TaskItem t) => new
        {
            id = t.Id,
            title = t.Title,
            description = t.Description,
            status = t.Status.ToString(),
            deadline = t.Deadline?.ToString("yyyy-MM-dd"),
            assigneeId = t.Assignee.Id,
            assigneeName = t.Assignee.FullName,
            createdById = t.CreatedBy.Id,
            createdByName = t.CreatedBy.FullName,
            createdAt = t.CreatedAt.ToString("o"),
            updatedAt = t.UpdatedAt.ToString("o")
        };
    }

    public record CreateTaskRequest(string Title, string Description, string? AssigneeId, DateTime? Deadline);

    public record UpdateTaskRequest(string? Title, string? Description, string? AssigneeId, DateTime? Deadline);

    public record StatusChangeRequest(string Status);

    public record DeadlineChangeRequest(DateTime? Deadline, string? Comment);
}