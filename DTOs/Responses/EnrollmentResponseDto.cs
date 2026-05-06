public class EnrollmentResponseDto
{
    public int Id { get; set; }
    public string EnrolledAt { get; set; } = string.Empty;
    public string? Grade { get; set; }
    public int StudentId { get; set; }
    public int CourseId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string CourseTitle { get; set; } = string.Empty;
}
