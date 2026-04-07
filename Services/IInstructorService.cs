public interface IInstructorService
{
    Task<List<InstructorResponseDto>> GetAllAsync();
    Task<InstructorResponseDto?> GetByIdAsync(int id);
    Task<InstructorResponseDto> CreateAsync(CreateInstructorDto dto);
    Task<bool> DeleteAsync(int id);
}