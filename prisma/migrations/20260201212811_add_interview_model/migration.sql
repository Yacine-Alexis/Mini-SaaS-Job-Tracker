-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('PHONE', 'VIDEO', 'ONSITE', 'TECHNICAL', 'BEHAVIORAL', 'FINAL', 'OTHER');

-- CreateEnum
CREATE TYPE "InterviewResult" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'INTERVIEW_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'INTERVIEW_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'INTERVIEW_DELETED';

-- CreateTable
CREATE TABLE "Interview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "type" "InterviewType" NOT NULL DEFAULT 'VIDEO',
    "location" TEXT,
    "interviewers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "feedback" TEXT,
    "result" "InterviewResult" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Interview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Interview_userId_applicationId_idx" ON "Interview"("userId", "applicationId");

-- CreateIndex
CREATE INDEX "Interview_userId_scheduledAt_idx" ON "Interview"("userId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Interview_applicationId_deletedAt_idx" ON "Interview"("applicationId", "deletedAt");

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
