using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Instructor> Instructors => Set<Instructor>();
    public DbSet<InstructorProfile> InstructorProfiles => Set<InstructorProfile>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("Users");
            e.HasIndex(u => u.Email).IsUnique();
            e.HasOne(u => u.Student)
                .WithOne(s => s.User)
                .HasForeignKey<User>(u => u.StudentId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasIndex(u => u.StudentId).IsUnique();
        });

        modelBuilder.Entity<Instructor>().ToTable("Instructors");
        modelBuilder.Entity<InstructorProfile>().ToTable("InstructorProfiles");
        modelBuilder.Entity<Course>().ToTable("Courses");
        modelBuilder.Entity<Student>().ToTable("Students");
        modelBuilder.Entity<Enrollment>().ToTable("Enrollments");

        // 1:1 — Instructor -> InstructorProfile
        modelBuilder.Entity<Instructor>()
            .HasOne(i => i.Profile)
            .WithOne(p => p.Instructor)
            .HasForeignKey<InstructorProfile>(p => p.InstructorId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Course>()
            .HasIndex(c => c.InstructorId).HasDatabaseName("IX_Courses_InstructorId");

        modelBuilder.Entity<Enrollment>()
            .HasIndex(e => e.CourseId).HasDatabaseName("IX_Enrollments_CourseId");
        modelBuilder.Entity<Enrollment>()
            .HasIndex(e => e.StudentId).HasDatabaseName("IX_Enrollments_StudentId");

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