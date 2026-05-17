using System.Text.Json;
using Microsoft.EntityFrameworkCore;

public class EnrollmentService : IEnrollmentService
{
    private readonly AppDbContext _context;

    public EnrollmentService(AppDbContext context)
    {
        _context = context;
    }

    private static EnrollmentResponseDto MapDto(Enrollment e) => new()
    {
        Id = e.Id,
        EnrolledAt = e.EnrolledAt.ToUniversalTime().ToString("o"),
        Status = string.IsNullOrEmpty(e.Status) ? "approved" : e.Status,
        Grade = e.Grade,
        StudentId = e.StudentId,
        CourseId = e.CourseId,
        StudentName = e.Student.FullName,
        CourseTitle = e.Course.Title,
    };

    public async Task<List<EnrollmentResponseDto>> GetAllAsync()
    {
        var list = await _context.Enrollments
            .AsNoTracking()
            .Include(e => e.Student)
            .Include(e => e.Course)
            .OrderByDescending(e => e.EnrolledAt)
            .ToListAsync();

        return list.ConvertAll(MapDto);
    }

    public async Task<EnrollmentResponseDto?> GetByIdAsync(int id)
    {
        var e = await _context.Enrollments
            .AsNoTracking()
            .Include(x => x.Student)
            .Include(x => x.Course)
            .FirstOrDefaultAsync(x => x.Id == id);
        return e is null ? null : MapDto(e);
    }

    public async Task<EnrollmentResponseDto?> CreateAsync(CreateEnrollmentDto dto)
    {
        var studentOK = await _context.Students.AnyAsync(s => s.Id == dto.StudentId);
        if (!studentOK) throw new ArgumentException("Student not found");

        var courseOK = await _context.Courses.AnyAsync(c => c.Id == dto.CourseId);
        if (!courseOK) throw new ArgumentException("Course not found");

        var dup = await _context.Enrollments.AnyAsync(
            x => x.StudentId == dto.StudentId && x.CourseId == dto.CourseId);
        if (dup) throw new InvalidOperationException("EnrollmentDup");

        var entity = new Enrollment
        {
            StudentId = dto.StudentId,
            CourseId = dto.CourseId,
            EnrolledAt = NormalizeEnrolledAt(dto.EnrolledAt),
            Grade = dto.Grade,
            Status = NormalizeStatusOrDefault(dto.Status),
        };
        _context.Enrollments.Add(entity);
        await _context.SaveChangesAsync();

        await _context.Entry(entity).Reference(x => x.Student).LoadAsync();
        await _context.Entry(entity).Reference(x => x.Course).LoadAsync();

        return MapDto(entity);
    }

    public async Task<EnrollmentResponseDto?> PatchAsync(int id, JsonElement body)
    {
        var gradePresent = body.TryGetProperty("grade", out var gradeProp);
        var enrolledPresent = body.TryGetProperty("enrolledAt", out var enrolledProp);
        var statusPresent = body.TryGetProperty("status", out var statusProp);

        if (!gradePresent && !enrolledPresent && !statusPresent)
            throw new ArgumentException("Validation failed");

        var entity = await _context.Enrollments
            .Include(e => e.Student)
            .Include(e => e.Course)
            .FirstOrDefaultAsync(e => e.Id == id);
        if (entity is null) return null;

        if (gradePresent)
        {
            if (gradeProp.ValueKind == JsonValueKind.Null)
            {
                entity.Grade = null;
            }
            else if (gradeProp.ValueKind != JsonValueKind.String)
            {
                throw new ArgumentException("Validation failed");
            }
            else
            {
                var g = gradeProp.GetString() ?? "";
                if (g.Length > 10) throw new ArgumentException("Validation failed");
                entity.Grade = g;
            }
        }

        if (enrolledPresent)
        {
            if (enrolledProp.ValueKind == JsonValueKind.Null)
                throw new ArgumentException("Validation failed");
            var s = enrolledProp.GetString();
            if (string.IsNullOrEmpty(s) || !DateTime.TryParse(s, out var dt))
                throw new ArgumentException("Validation failed");
            entity.EnrolledAt = dt.Kind == DateTimeKind.Unspecified
                ? DateTime.SpecifyKind(dt, DateTimeKind.Utc)
                : dt.ToUniversalTime();
        }

        if (statusPresent)
        {
            if (statusProp.ValueKind == JsonValueKind.Null)
                throw new ArgumentException("Validation failed");
            if (statusProp.ValueKind != JsonValueKind.String)
                throw new ArgumentException("Validation failed");
            entity.Status = ParseStatusStrict(statusProp.GetString());
            if (entity.Status == "rejected")
                entity.Grade = null;
        }

        await _context.SaveChangesAsync();
        return MapDto(entity);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await _context.Enrollments.FindAsync(id);
        if (entity is null) return false;
        _context.Enrollments.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    private static string NormalizeStatusOrDefault(string? s)
    {
        if (string.IsNullOrWhiteSpace(s)) return "approved";
        return ParseStatusStrict(s);
    }

    private static string ParseStatusStrict(string? raw)
    {
        var t = (raw ?? "").Trim().ToLowerInvariant();
        return t switch
        {
            "pending" or "approved" or "rejected" => t,
            _ => throw new ArgumentException("Validation failed"),
        };
    }

    private static DateTime NormalizeEnrolledAt(DateTime? enrolledAt)
    {
        if (!enrolledAt.HasValue) return DateTime.UtcNow;
        var v = enrolledAt.Value;
        return v.Kind switch
        {
            DateTimeKind.Utc => v,
            DateTimeKind.Local => v.ToUniversalTime(),
            _ => DateTime.SpecifyKind(v, DateTimeKind.Utc),
        };
    }
}
