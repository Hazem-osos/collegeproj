public interface IStudentService
{
    Task<List<StudentResponseDto>> GetAllAsync();
    Task<StudentResponseDto?> GetByIdAsync(int id);
    Task<StudentResponseDto> CreateAsync(CreateStudentDto dto);
    Task<bool> DeleteAsync(int id);
}