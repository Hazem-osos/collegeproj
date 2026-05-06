using System.Text.Json;

public interface IEnrollmentService
{
    Task<List<EnrollmentResponseDto>> GetAllAsync();
    Task<EnrollmentResponseDto?> GetByIdAsync(int id);
    Task<EnrollmentResponseDto?> CreateAsync(CreateEnrollmentDto dto);
    Task<EnrollmentResponseDto?> PatchAsync(int id, JsonElement body);
    Task<bool> DeleteAsync(int id);
}
