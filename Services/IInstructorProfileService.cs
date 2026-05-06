using System.Text.Json;

public interface IInstructorProfileService
{
    Task<List<InstructorProfileResponseDto>> GetAllAsync();
    Task<InstructorProfileResponseDto?> GetByIdAsync(int id);
    Task<InstructorProfileResponseDto?> CreateAsync(CreateInstructorProfileDto dto);
    Task<InstructorProfileResponseDto?> PatchAsync(int id, JsonElement body);
    Task<bool> DeleteAsync(int id);
}
