using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Instructor> Instructors => Set<Instructor>();
    public DbSet<InstructorProfile> InstructorProfiles => Set<InstructorProfile>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // 1:1 — Instructor -> InstructorProfile
        modelBuilder.Entity<Instructor>()
            .HasOne(i => i.Profile)
            .WithOne(p => p.Instructor)
            .HasForeignKey<InstructorProfile>(p => p.InstructorId);

        // String lengths (align with Prisma / MySQL schema)
        modelBuilder.Entity<Instructor>()
            .Property(i => i.Email).HasMaxLength(255);
        modelBuilder.Entity<Instructor>()
            .Property(i => i.FullName).HasMaxLength(255);
        modelBuilder.Entity<Student>()
            .Property(s => s.Email).HasMaxLength(255);
        modelBuilder.Entity<Student>()
            .Property(s => s.FullName).HasMaxLength(255);
        modelBuilder.Entity<Course>()
            .Property(c => c.Title).HasMaxLength(255);
        modelBuilder.Entity<InstructorProfile>()
            .Property(p => p.Bio).HasMaxLength(1000);
        modelBuilder.Entity<InstructorProfile>()
            .Property(p => p.OfficeLocation).HasMaxLength(255);
        modelBuilder.Entity<Enrollment>()
            .Property(e => e.Grade).HasMaxLength(10);
    }
}