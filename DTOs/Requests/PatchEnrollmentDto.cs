using System.ComponentModel.DataAnnotations;

public class PatchEnrollmentDto
{
    [MaxLength(10)]
    public string? Grade { get; set; }

    public DateTime? EnrolledAt { get; set; }
}
