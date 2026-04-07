public interface ICourseService
{
    Task<List<CourseResponseDto>> GetAllAsync();
    Task<CourseResponseDto?> GetByIdAsync(int id);
    Task<CourseResponseDto> CreateAsync(CreateCourseDto dto);
    Task<bool> DeleteAsync(int id);
}