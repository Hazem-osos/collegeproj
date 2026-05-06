public class InstructorProfileResponseDto
{
    public int Id { get; set; }
    public int InstructorId { get; set; }
    public string Bio { get; set; } = string.Empty;
    public string OfficeLocation { get; set; } = string.Empty;
    public string InstructorName { get; set; } = string.Empty;
    public string InstructorEmail { get; set; } = string.Empty;
}
