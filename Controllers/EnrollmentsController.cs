using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

[ApiController]
[Route("api/enrollments")]
[Authorize(Roles = "Admin")]
public class EnrollmentsController : ControllerBase
{
    private readonly IEnrollmentService _enrollmentService;

    public EnrollmentsController(IEnrollmentService enrollmentService)
    {
        _enrollmentService = enrollmentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var rows = await _enrollmentService.GetAllAsync();
        return Ok(rows);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        if (id < 1) return BadRequest(new { error = "Invalid id" });
        var row = await _enrollmentService.GetByIdAsync(id);
        return row is null ? NotFound(new { error = "Not found" }) : Ok(row);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEnrollmentDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(new { error = "Validation failed" });
        try
        {
            var created = await _enrollmentService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created!.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex) when (ex.Message == "EnrollmentDup")
        {
            return Conflict(new { error = "Enrollment already exists for this student and course" });
        }
    }

    [HttpPatch("{id:int}")]
    public async Task<IActionResult> Patch(int id, [FromBody] JsonElement body)
    {
        if (id < 1) return BadRequest(new { error = "Invalid id" });
        try
        {
            var updated = await _enrollmentService.PatchAsync(id, body);
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
        var deleted = await _enrollmentService.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
