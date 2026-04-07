public class Instructor
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;

    // 1:1 — one instructor has one profile
    public InstructorProfile? Profile { get; set; }

    // 1:N — one instructor teaches many courses
    public ICollection<Course> Courses { get; set; } = new List<Course>();
}