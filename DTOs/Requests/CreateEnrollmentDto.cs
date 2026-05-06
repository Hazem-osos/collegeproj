using System.ComponentModel.DataAnnotations;

public class CreateEnrollmentDto
{
    [Required]
    public int StudentId { get; set; }

    [Required]
    public int CourseId { get; set; }

    public DateTime? EnrolledAt { get; set; }

    [MaxLength(10)]
    public string? Grade { get; set; }
}
