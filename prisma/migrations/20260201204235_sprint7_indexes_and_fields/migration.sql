-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RemoteType" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP');

-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN     "description" TEXT,
ADD COLUMN     "jobType" "JobType",
ADD COLUMN     "nextFollowUp" TIMESTAMP(3),
ADD COLUMN     "priority" "Priority" DEFAULT 'MEDIUM',
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "remoteType" "RemoteType",
ADD COLUMN     "salaryCurrency" TEXT DEFAULT 'USD';

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "JobApplication_userId_appliedDate_idx" ON "JobApplication"("userId", "appliedDate");

-- CreateIndex
CREATE INDEX "JobApplication_userId_deletedAt_idx" ON "JobApplication"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "Task_userId_status_dueDate_idx" ON "Task"("userId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "Task_applicationId_deletedAt_idx" ON "Task"("applicationId", "deletedAt");
