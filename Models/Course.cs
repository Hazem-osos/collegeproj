public class Course
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Credits { get; set; }

    // FK — many courses belong to one instructor
    public int InstructorId { get; set; }
    public Instructor Instructor { get; set; } = null!;

    // M:N — via Enrollment join entity
    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
}