-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'LABEL_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'LABEL_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'LABEL_DELETED';

-- CreateTable
CREATE TABLE "Label" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Label_userId_deletedAt_idx" ON "Label"("userId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Label_userId_name_key" ON "Label"("userId", "name");

-- AddForeignKey
ALTER TABLE "Label" ADD CONSTRAINT "Label_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
