export type CourseItem = {
  id: number;
  title: string;
  credits: number;
  instructorName: string;
};

export type PersonItem = { id: number; fullName: string; email: string };

export type EnrollmentItem = {
  id: number;
  enrolledAt: string;
  grade: string | null;
  studentId: number;
  courseId: number;
  studentName: string;
  courseTitle: string;
};

export type InstructorProfileItem = {
  id: number;
  instructorId: number;
  bio: string;
  officeLocation: string;
  instructorName: string;
  instructorEmail: string;
};
