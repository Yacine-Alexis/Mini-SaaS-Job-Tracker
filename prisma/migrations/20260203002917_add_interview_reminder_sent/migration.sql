-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "reminderSent" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Interview_reminderSent_scheduledAt_idx" ON "Interview"("reminderSent", "scheduledAt");
