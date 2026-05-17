using System.ComponentModel.DataAnnotations;

public class CreateInstructorAccountDto
{
    [Required, EmailAddress, MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8), MaxLength(256)]
    public string Password { get; set; } = string.Empty;
}
