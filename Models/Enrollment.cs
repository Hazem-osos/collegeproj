public class Enrollment
{
    public int Id { get; set; }
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    /// <summary>pending | approved | rejected (matches Prisma).</summary>
    public string Status { get; set; } = "approved";
    public string? Grade { get; set; }

    public int StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public int CourseId { get; set; }
    public Course Course { get; set; } = null!;
}