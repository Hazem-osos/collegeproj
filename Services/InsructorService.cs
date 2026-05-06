using Microsoft.EntityFrameworkCore;

public class InstructorService : IInstructorService
{
    private readonly AppDbContext _context;

    public InstructorService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<InstructorResponseDto>> GetAllAsync()
    {
        return await _context.Instructors
            .AsNoTracking()
            .Select(i => new InstructorResponseDto
            {
                Id = i.Id,
                FullName = i.FullName,
                Email = i.Email
            })
            .ToListAsync();
    }

    public async Task<InstructorResponseDto?> GetByIdAsync(int id)
    {
        return await _context.Instructors
            .AsNoTracking()
            .Where(i => i.Id == id)
            .Select(i => new InstructorResponseDto
            {
                Id = i.Id,
                FullName = i.FullName,
                Email = i.Email
            })
            .FirstOrDefaultAsync();
    }

    public async Task<InstructorResponseDto> CreateAsync(CreateInstructorDto dto)
    {
        var instructor = new Instructor
        {
            FullName = dto.FullName,
            Email = dto.Email
        };
        _context.Instructors.Add(instructor);
        await _context.SaveChangesAsync();
        return await GetByIdAsync(instructor.Id) ?? throw new Exception("Save failed");
    }

    public async Task<InstructorResponseDto?> PatchAsync(int id, PatchInstructorDto dto)
    {
        if (dto.FullName is null && dto.Email is null)
            throw new ArgumentException("Validation failed");

        var instructor = await _context.Instructors.FindAsync(id);
        if (instructor is null) return null;

        if (dto.FullName is not null) instructor.FullName = dto.FullName;
        if (dto.Email is not null) instructor.Email = dto.Email;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var instructor = await _context.Instructors.FindAsync(id);
        if (instructor is null) return false;
        _context.Instructors.Remove(instructor);
        await _context.SaveChangesAsync();
        return true;
    }
}