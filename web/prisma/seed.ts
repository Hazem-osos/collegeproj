import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  await prisma.user.upsert({
    where: { email: "admin@uni.com" },
    create: {
      email: "admin@uni.com",
      passwordHash,
      role: "Admin",
      studentId: null,
    },
    update: { passwordHash, role: "Admin", studentId: null },
  });

  const existing = await prisma.instructor.findFirst({
    where: { email: "instructor@uni.com" },
  });
  const instructor =
    existing ??
    (await prisma.instructor.create({
      data: {
        fullName: "Dr. Sample Instructor",
        email: "instructor@uni.com",
      },
    }));

  const hasCourse = await prisma.course.findFirst({
    where: { title: "Introduction to Databases" },
  });
  if (!hasCourse) {
    await prisma.course.create({
      data: {
        title: "Introduction to Databases",
        credits: 3,
        instructorId: instructor.id,
      },
    });
  }

  console.log("Seed OK — admin login: admin@uni.com / password123");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect();
  });
