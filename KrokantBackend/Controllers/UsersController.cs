using KrokantBackend.Data;
using KrokantBackend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KrokantBackend.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly KrokantContext _context;

        public UsersController(KrokantContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize]
        public IActionResult Get([FromQuery] UserRole? role)
        {
            var q = _context.Users.AsQueryable();
            if (role.HasValue)
                q = q.Where(u => u.Role == role.Value);

            var items = q.Select(u => new { id = u.Id, fullName = u.FullName, role = u.Role.ToString() });
            return Ok(items);
        }
    }
}