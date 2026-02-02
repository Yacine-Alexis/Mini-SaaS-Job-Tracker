-- CreateEnum
CREATE TYPE "DigestFrequency" AS ENUM ('NEVER', 'DAILY', 'WEEKLY', 'MONTHLY');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'EMAIL_PREFERENCES_UPDATED';

-- CreateTable
CREATE TABLE "EmailPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interviewReminder" BOOLEAN NOT NULL DEFAULT true,
    "interviewReminderHours" INTEGER NOT NULL DEFAULT 24,
    "taskReminder" BOOLEAN NOT NULL DEFAULT true,
    "taskReminderHours" INTEGER NOT NULL DEFAULT 24,
    "followUpReminder" BOOLEAN NOT NULL DEFAULT true,
    "statusChangeNotify" BOOLEAN NOT NULL DEFAULT true,
    "digestFrequency" "DigestFrequency" NOT NULL DEFAULT 'WEEKLY',
    "digestDay" INTEGER NOT NULL DEFAULT 1,
    "digestHour" INTEGER NOT NULL DEFAULT 9,
    "staleAlertEnabled" BOOLEAN NOT NULL DEFAULT true,
    "staleAlertDays" INTEGER NOT NULL DEFAULT 14,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "unsubscribedAll" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailPreferences_userId_key" ON "EmailPreferences"("userId");

-- CreateIndex
CREATE INDEX "EmailPreferences_userId_idx" ON "EmailPreferences"("userId");

-- AddForeignKey
ALTER TABLE "EmailPreferences" ADD CONSTRAINT "EmailPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
