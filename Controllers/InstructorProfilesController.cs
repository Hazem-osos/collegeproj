using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

[ApiController]
[Route("api/instructor-profiles")]
[Authorize(Roles = "Admin")]
public class InstructorProfilesController : ControllerBase
{
    private readonly IInstructorProfileService _profileService;

    public InstructorProfilesController(IInstructorProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var rows = await _profileService.GetAllAsync();
        return Ok(rows);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        if (id < 1) return BadRequest(new { error = "Invalid id" });
        var row = await _profileService.GetByIdAsync(id);
        return row is null ? NotFound(new { error = "Not found" }) : Ok(row);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInstructorProfileDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(new { error = "Validation failed" });
        try
        {
            var created = await _profileService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created!.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex) when (ex.Message == "ProfileDup")
        {
            return Conflict(new { error = "Profile already exists for this instructor — use PATCH" });
        }
    }

    [HttpPatch("{id:int}")]
    public async Task<IActionResult> Patch(int id, [FromBody] JsonElement body)
    {
        if (id < 1) return BadRequest(new { error = "Invalid id" });
        try
        {
            var updated = await _profileService.PatchAsync(id, body);
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
        var deleted = await _profileService.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
