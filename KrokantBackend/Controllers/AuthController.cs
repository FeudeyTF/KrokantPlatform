using KrokantBackend.Data;
using KrokantBackend.Services;
using Microsoft.AspNetCore.Mvc;

namespace KrokantBackend.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly KrokantContext _context;

        private readonly JwtService _jwt;

        public AuthController(KrokantContext context, JwtService jwt)
        {
            _context = context;
            _jwt = jwt;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            var user = _context.Users.SingleOrDefault(u => u.Email == request.Email && u.Password == request.Password);

            if (user == null)
                return Unauthorized(new { error = new { code = "UNAUTHORIZED", message = "Invalid credentials" } });

            var token = _jwt.GenerateToken(user);

            object response = new
            {
                accessToken = token,
                user = new { id = user.Id, fullName = user.FullName, email = user.Email, role = user.Role.ToString() }
            };

            return Ok(response);
        }
    }

    public record LoginRequest(string Email, string Password);
}