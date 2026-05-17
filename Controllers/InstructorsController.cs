using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

[ApiController]
[Route("api/instructors")]
[Authorize(Roles = "Admin")]
public class InstructorsController : ControllerBase
{
    private readonly IInstructorService _instructorService;
    private readonly AppDbContext _db;

    public InstructorsController(IInstructorService instructorService, AppDbContext db)
    {
        _instructorService = instructorService;
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _instructorService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        if (id < 1) return BadRequest(new { error = "Invalid id" });
        var result = await _instructorService.GetByIdAsync(id);
        return result is null ? NotFound(new { error = "Not found" }) : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInstructorDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(new { error = "Validation failed" });
        var created = await _instructorService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>Admin-only portal login for an instructor (same rules as Next <c>POST /api/instructors/:id/account</c>).</summary>
    [HttpPost("{id:int}/account")]
    public async Task<IActionResult> CreateAccount(int id, [FromBody] CreateInstructorAccountDto dto)
    {
        if (id < 1) return BadRequest(new { error = "Invalid id" });
        if (!ModelState.IsValid)
            return BadRequest(new { error = "Validation failed (email, password ≥ 8)" });

        var instructorExists = await _db.Instructors.AsNoTracking().AnyAsync(i => i.Id == id);
        if (!instructorExists) return NotFound(new { error = "Instructor not found" });

        if (await _db.Users.AnyAsync(u => u.InstructorId == id))
            return Conflict(new { error = "This instructor already has a login account" });

        var normalized = dto.Email.Trim().ToLowerInvariant();

        if (await _db.Users.AnyAsync(u => u.Email == normalized))
            return Conflict(new { error = "Email already in use by another login" });

        _db.Users.Add(new User
        {
            Email = normalized,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = "Instructor",
            InstructorId = id
        });
        await _db.SaveChangesAsync();

        return StatusCode(201, new { ok = true, email = normalized, instructorId = id });
    }

    [HttpPatch("{id:int}")]
    public async Task<IActionResult> Patch(int id, [FromBody] PatchInstructorDto? dto)
    {
        if (id < 1) return BadRequest(new { error = "Invalid id" });
        if (dto is null) return BadRequest(new { error = "Validation failed" });
        try
        {
            var updated = await _instructorService.PatchAsync(id, dto);
            return updated is null ? NotFound(new { error = "Not found" }) : Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (id < 1) return BadRequest(new { error = "Invalid id" });
        var deleted = await _instructorService.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
