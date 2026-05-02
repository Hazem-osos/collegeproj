-- AlterTable
ALTER TABLE `Users` ADD COLUMN `StudentId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Users_StudentId_key` ON `Users`(`StudentId`);

-- AddForeignKey
ALTER TABLE `Users` ADD CONSTRAINT `Users_StudentId_fkey` FOREIGN KEY (`StudentId`) REFERENCES `Students`(`Id`) ON DELETE SET NULL ON UPDATE CASCADE;
