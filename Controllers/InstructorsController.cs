using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/instructors")]
[Authorize(Roles = "Admin")]
public class InstructorsController : ControllerBase
{
    private readonly IInstructorService _instructorService;

    public InstructorsController(IInstructorService instructorService)
    {
        _instructorService = instructorService;
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
