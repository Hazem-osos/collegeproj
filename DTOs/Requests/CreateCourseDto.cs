using System.ComponentModel.DataAnnotations;

public class CreateCourseDto
{
    [Required]
    [MaxLength(100)]
    public string Title { get; set; } = string.Empty;

    [Range(1, 10)]
    public int Credits { get; set; }

    [Required]
    public int InstructorId { get; set; }
}