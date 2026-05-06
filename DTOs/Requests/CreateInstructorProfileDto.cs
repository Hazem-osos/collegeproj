using System.ComponentModel.DataAnnotations;

public class CreateInstructorProfileDto
{
    [Required]
    public int InstructorId { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Bio { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string OfficeLocation { get; set; } = string.Empty;
}
