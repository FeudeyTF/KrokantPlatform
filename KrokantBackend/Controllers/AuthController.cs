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
        private readonly PasswordHasherService _passwordHasher;

        public AuthController(KrokantContext context, JwtService jwt, PasswordHasherService passwordHasher)
        {
            _context = context;
            _jwt = jwt;
            _passwordHasher = passwordHasher;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            var user = _context.Users.SingleOrDefault(u => u.Email == request.Email);

            if (user == null || !_passwordHasher.VerifyPassword(user.Password, request.Password))
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
