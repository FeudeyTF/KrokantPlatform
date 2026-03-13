using KrokantBackend.Data;
using KrokantBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KrokantBackend.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly KrokantContext _context;
        
        public DashboardController(KrokantContext context)
        {
            _context = context;
        }

        [HttpGet("summary")]
        [Authorize(Roles = "HEAD")]
        public IActionResult Summary()
        {
            var all = _context.Tasks.ToList();
            var total = all.Count;
            var newTasks = all.Count(t => t.Status == TaskStatus.NEW);
            var inProgress = all.Count(t => t.Status == TaskStatus.IN_PROGRESS);
            var done = all.Count(t => t.Status == TaskStatus.DONE);
            var overdue = all.Count(t => t.Deadline.HasValue && t.Deadline.Value.Date < DateTime.UtcNow.Date && t.Status != TaskStatus.DONE);

            return Ok(new { totalTasks = total, newTasks, inProgressTasks = inProgress, doneTasks = done, overdueTasks = overdue });
        }

        [HttpGet("workload")]
        [Authorize(Roles = "HEAD")]
        public IActionResult Workload()
        {
            var teachers = _context.Users.Where(u => u.Role == UserRole.TEACHER).ToList();
            var result = teachers.Select(t =>
            {
                var tasks = _context.Tasks.Where(x => x.Assignee.Id == t.Id).ToList();
                return new
                {
                    teacherId = t.Id,
                    teacherName = t.FullName,
                    @new = tasks.Count(x => x.Status == TaskStatus.NEW),
                    inProgress = tasks.Count(x => x.Status == TaskStatus.IN_PROGRESS),
                    done = tasks.Count(x => x.Status == TaskStatus.DONE),
                    overdue = tasks.Count(x => x.Deadline.HasValue && x.Deadline.Value.Date < DateTime.UtcNow.Date && x.Status != TaskStatus.DONE)
                };
            });
            return Ok(result);
        }
    }
}