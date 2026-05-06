using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/students")]
[Authorize(Roles = "Admin")]
public class StudentsController : ControllerBase
{
    private readonly IStudentService _studentService;

    public StudentsController(IStudentService studentService)
    {
        _studentService = studentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _studentService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        if (id < 1) return BadRequest(new { error = "Invalid id" });
        var result = await _studentService.GetByIdAsync(id);
        return result is null ? NotFound(new { error = "Not found" }) : Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStudentDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(new { error = "Validation failed" });
        var created = await _studentService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPatch("{id:int}")]
    public async Task<IActionResult> Patch(int id, [FromBody] PatchStudentDto? dto)
    {
        if (id < 1) return BadRequest(new { error = "Invalid id" });
        if (dto is null) return BadRequest(new { error = "Validation failed" });
        try
        {
            var updated = await _studentService.PatchAsync(id, dto);
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
        var deleted = await _studentService.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
