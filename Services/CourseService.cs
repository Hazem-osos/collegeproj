using Microsoft.EntityFrameworkCore;
public class CourseService : ICourseService
{
    private readonly AppDbContext _context;

    public CourseService(AppDbContext context)
    {
        _context = context;  // injected by DI
    }

    public async Task<List<CourseResponseDto>> GetAllAsync()
    {
        return await _context.Courses
            .AsNoTracking()                          // read-only: no change tracking overhead
            .Select(c => new CourseResponseDto       // project directly — never load full entity
            {
                Id = c.Id,
                Title = c.Title,
                Credits = c.Credits,
                InstructorName = c.Instructor.FullName
            })
            .ToListAsync();
    }

    public async Task<CourseResponseDto?> GetByIdAsync(int id)
    {
        return await _context.Courses
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new CourseResponseDto
            {
                Id = c.Id,
                Title = c.Title,
                Credits = c.Credits,
                InstructorName = c.Instructor.FullName
            })
            .FirstOrDefaultAsync();
    }

    public async Task<CourseResponseDto> CreateAsync(CreateCourseDto dto)
    {
        var instructorExists = await _context.Instructors.AnyAsync(i => i.Id == dto.InstructorId);
        if (!instructorExists)
            throw new ArgumentException("Instructor not found");

        var course = new Course
        {
            Title = dto.Title,
            Credits = dto.Credits,
            InstructorId = dto.InstructorId
        };
        _context.Courses.Add(course);
        await _context.SaveChangesAsync();

        return await GetByIdAsync(course.Id) ?? throw new Exception("Save failed");
    }

    public async Task<CourseResponseDto?> PatchAsync(int id, PatchCourseDto dto)
    {
        if (dto.Title is null && !dto.Credits.HasValue && !dto.InstructorId.HasValue)
            throw new ArgumentException("Validation failed");

        var course = await _context.Courses.FindAsync(id);
        if (course is null) return null;

        if (dto.InstructorId.HasValue)
        {
            var instructorExists = await _context.Instructors.AnyAsync(i => i.Id == dto.InstructorId.Value);
            if (!instructorExists)
                throw new ArgumentException("Instructor not found");
            course.InstructorId = dto.InstructorId.Value;
        }

        if (dto.Title is not null) course.Title = dto.Title;
        if (dto.Credits.HasValue) course.Credits = dto.Credits.Value;

        await _context.SaveChangesAsync();
        return await GetByIdAsync(id);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var course = await _context.Courses.FindAsync(id);
        if (course is null) return false;
        _context.Courses.Remove(course);
        await _context.SaveChangesAsync();
        return true;
    }
}