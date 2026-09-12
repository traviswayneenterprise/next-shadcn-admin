-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'NEEDS_CORRECTION');

-- AlterTable
ALTER TABLE "LessonVersion" ADD COLUMN "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "ReusableBlock" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
