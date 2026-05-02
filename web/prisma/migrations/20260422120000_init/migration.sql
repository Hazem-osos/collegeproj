-- CreateTable
CREATE TABLE `Instructors` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `FullName` VARCHAR(255) NOT NULL,
    `Email` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InstructorProfiles` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `Bio` VARCHAR(1000) NOT NULL,
    `OfficeLocation` VARCHAR(255) NOT NULL,
    `InstructorId` INTEGER NOT NULL,

    UNIQUE INDEX `InstructorProfiles_InstructorId_key`(`InstructorId`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Courses` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `Title` VARCHAR(255) NOT NULL,
    `Credits` INTEGER NOT NULL,
    `InstructorId` INTEGER NOT NULL,

    INDEX `IX_Courses_InstructorId`(`InstructorId`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Students` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `FullName` VARCHAR(255) NOT NULL,
    `Email` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Enrollments` (
    `Id` INTEGER NOT NULL AUTO_INCREMENT,
    `EnrolledAt` DATETIME(3) NOT NULL,
    `Grade` VARCHAR(10) NULL,
    `StudentId` INTEGER NOT NULL,
    `CourseId` INTEGER NOT NULL,

    INDEX `IX_Enrollments_CourseId`(`CourseId`),
    INDEX `IX_Enrollments_StudentId`(`StudentId`),
    PRIMARY KEY (`Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InstructorProfiles` ADD CONSTRAINT `InstructorProfiles_InstructorId_fkey` FOREIGN KEY (`InstructorId`) REFERENCES `Instructors`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Courses` ADD CONSTRAINT `Courses_InstructorId_fkey` FOREIGN KEY (`InstructorId`) REFERENCES `Instructors`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enrollments` ADD CONSTRAINT `Enrollments_StudentId_fkey` FOREIGN KEY (`StudentId`) REFERENCES `Students`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enrollments` ADD CONSTRAINT `Enrollments_CourseId_fkey` FOREIGN KEY (`CourseId`) REFERENCES `Courses`(`Id`) ON DELETE CASCADE ON UPDATE CASCADE;
