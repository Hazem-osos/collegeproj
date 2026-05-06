using System.ComponentModel.DataAnnotations;

public class PatchInstructorProfileDto
{
    [MaxLength(1000)]
    public string? Bio { get; set; }

    [MaxLength(255)]
    public string? OfficeLocation { get; set; }
}
