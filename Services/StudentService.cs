using Microsoft.EntityFrameworkCore;

public class StudentService : IStudentService
{
    private readonly AppDbContext _context;

    public StudentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<StudentResponseDto>> GetAllAsync()
    {
        return await _context.Students
            .AsNoTracking()
            .Select(s => new StudentResponseDto
            {
                Id = s.Id,
                FullName = s.FullName,
                Email = s.Email
            })
            .ToListAsync();
    }

    public async Task<StudentResponseDto?> GetByIdAsync(int id)
    {
        return await _context.Students
            .AsNoTracking()
            .Where(s => s.Id == id)
            .Select(s => new StudentResponseDto
            {
                Id = s.Id,
                FullName = s.FullName,
                Email = s.Email
            })
            .FirstOrDefaultAsync();
    }

    public async Task<StudentResponseDto> CreateAsync(CreateStudentDto dto)
    {
        var student = new Student
        {
            FullName = dto.FullName,
            Email = dto.Email
        };
        _context.Students.Add(student);
        await _context.SaveChangesAsync();
        return await GetByIdAsync(student.Id) ?? throw new Exception("Save failed");
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var student = await _context.Students.FindAsync(id);
        if (student is null) return false;
        _context.Students.Remove(student);
        await _context.SaveChangesAsync();
        return true;
    }
}