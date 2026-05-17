using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    /// <summary>Same rules as Next.js <c>POST /api/auth/login</c>: DB users (bcrypt) + bootstrap admin when no row.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var normalized = dto.Email.Trim().ToLowerInvariant();
        var password = dto.Password;

        string role;
        int? studentId = null;
        int? instructorId = null;

        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == normalized);
        if (user is not null)
        {
            if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
                return Unauthorized();
            role = user.Role;
            studentId = user.StudentId;
            instructorId = user.InstructorId;
        }
        else if (normalized == "admin@uni.com" && password == "password123")
        {
            role = "Admin";
        }
        else
        {
            return Unauthorized();
        }

        string? fullName = null;
        if (studentId.HasValue)
        {
            fullName = await _db.Students.AsNoTracking()
                .Where(s => s.Id == studentId.Value)
                .Select(s => s.FullName)
                .FirstOrDefaultAsync();
        }
        else if (instructorId.HasValue)
        {
            fullName = await _db.Instructors.AsNoTracking()
                .Where(i => i.Id == instructorId.Value)
                .Select(i => i.FullName)
                .FirstOrDefaultAsync();
        }

        var token = GenerateToken(normalized, role, studentId, instructorId);
        return Ok(new
        {
            token,
            user = new
            {
                email = normalized,
                role,
                studentId,
                instructorId,
                fullName,
            },
        });
    }

    private string GenerateToken(string email, string role, int? studentId, int? instructorId)
    {
        var claims = new List<Claim>
        {
            new("email", email),
            new("role", role),
        };
        if (studentId.HasValue)
            claims.Add(new Claim("studentId", studentId.Value.ToString(), ClaimValueTypes.Integer32));
        if (instructorId.HasValue)
            claims.Add(new Claim("instructorId", instructorId.Value.ToString(), ClaimValueTypes.Integer32));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(1),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
