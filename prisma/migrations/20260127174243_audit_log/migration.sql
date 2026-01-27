-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('AUTH_LOGIN', 'AUTH_LOGOUT', 'AUTH_PASSWORD_RESET', 'APPLICATION_CREATED', 'APPLICATION_UPDATED', 'APPLICATION_DELETED', 'NOTE_CREATED', 'NOTE_UPDATED', 'NOTE_DELETED', 'TASK_CREATED', 'TASK_UPDATED', 'TASK_DELETED', 'CONTACT_CREATED', 'CONTACT_UPDATED', 'CONTACT_DELETED', 'LINK_CREATED', 'LINK_UPDATED', 'LINK_DELETED', 'EXPORT_CSV', 'BILLING_UPGRADED', 'BILLING_DOWNGRADED');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "meta" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
