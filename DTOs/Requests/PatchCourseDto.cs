using System.ComponentModel.DataAnnotations;

public class PatchCourseDto
{
    [MaxLength(100)]
    public string? Title { get; set; }

    [Range(1, 10)]
    public int? Credits { get; set; }

    public int? InstructorId { get; set; }
}
