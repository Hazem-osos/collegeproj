using System.ComponentModel.DataAnnotations;

public class PatchInstructorDto
{
    [MaxLength(100)]
    public string? FullName { get; set; }

    [EmailAddress]
    [MaxLength(255)]
    public string? Email { get; set; }
}
