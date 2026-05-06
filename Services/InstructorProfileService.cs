using System.Text.Json;
using Microsoft.EntityFrameworkCore;

public class InstructorProfileService : IInstructorProfileService
{
    private readonly AppDbContext _context;

    public InstructorProfileService(AppDbContext context)
    {
        _context = context;
    }

    private static InstructorProfileResponseDto MapDto(InstructorProfile p, Instructor instructor) => new()
    {
        Id = p.Id,
        InstructorId = p.InstructorId,
        Bio = p.Bio,
        OfficeLocation = p.OfficeLocation,
        InstructorName = instructor.FullName,
        InstructorEmail = instructor.Email,
    };

    public async Task<List<InstructorProfileResponseDto>> GetAllAsync()
    {
        var rows = await _context.InstructorProfiles
            .AsNoTracking()
            .Include(p => p.Instructor)
            .OrderBy(p => p.Id)
            .ToListAsync();

        return rows.ConvertAll(p => MapDto(p, p.Instructor));
    }

    public async Task<InstructorProfileResponseDto?> GetByIdAsync(int id)
    {
        var p = await _context.InstructorProfiles
            .AsNoTracking()
            .Include(x => x.Instructor)
            .FirstOrDefaultAsync(x => x.Id == id);
        return p is null ? null : MapDto(p, p.Instructor);
    }

    public async Task<InstructorProfileResponseDto?> CreateAsync(CreateInstructorProfileDto dto)
    {
        var instructor = await _context.Instructors.AnyAsync(i => i.Id == dto.InstructorId);
        if (!instructor) throw new ArgumentException("Instructor not found");

        var dup = await _context.InstructorProfiles.AnyAsync(p => p.InstructorId == dto.InstructorId);
        if (dup) throw new InvalidOperationException("ProfileDup");

        var entity = new InstructorProfile
        {
            InstructorId = dto.InstructorId,
            Bio = dto.Bio,
            OfficeLocation = dto.OfficeLocation,
        };
        _context.InstructorProfiles.Add(entity);
        await _context.SaveChangesAsync();

        await _context.Entry(entity).Reference(x => x.Instructor).LoadAsync();
        return MapDto(entity, entity.Instructor);
    }

    public async Task<InstructorProfileResponseDto?> PatchAsync(int id, JsonElement body)
    {
        var bioPresent = body.TryGetProperty("bio", out var bioProp);
        var officePresent = body.TryGetProperty("officeLocation", out var officeProp);

        if (!bioPresent && !officePresent)
            throw new ArgumentException("Validation failed");

        var entity = await _context.InstructorProfiles
            .Include(x => x.Instructor)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (entity is null) return null;

        if (bioPresent)
        {
            if (bioProp.ValueKind != JsonValueKind.String) throw new ArgumentException("Validation failed");
            var b = bioProp.GetString();
            if (string.IsNullOrWhiteSpace(b) || b.Length > 1000) throw new ArgumentException("Validation failed");
            entity.Bio = b;
        }

        if (officePresent)
        {
            if (officeProp.ValueKind != JsonValueKind.String) throw new ArgumentException("Validation failed");
            var o = officeProp.GetString();
            if (string.IsNullOrWhiteSpace(o) || o.Length > 255) throw new ArgumentException("Validation failed");
            entity.OfficeLocation = o;
        }

        await _context.SaveChangesAsync();
        return MapDto(entity, entity.Instructor);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _context.InstructorProfiles.FindAsync(id);
        if (entity is null) return false;
        _context.InstructorProfiles.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }
}
