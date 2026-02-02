-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('INITIAL_OFFER', 'COUNTER_OFFER', 'REVISED_OFFER', 'FINAL_OFFER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'OFFER_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'OFFER_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'OFFER_DELETED';

-- CreateTable
CREATE TABLE "SalaryOffer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "OfferType" NOT NULL DEFAULT 'INITIAL_OFFER',
    "baseSalary" INTEGER NOT NULL,
    "bonus" INTEGER,
    "equity" TEXT,
    "signingBonus" INTEGER,
    "benefits" TEXT,
    "notes" TEXT,
    "offerDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAccepted" BOOLEAN,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SalaryOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalaryOffer_userId_applicationId_idx" ON "SalaryOffer"("userId", "applicationId");

-- CreateIndex
CREATE INDEX "SalaryOffer_userId_deletedAt_idx" ON "SalaryOffer"("userId", "deletedAt");

-- AddForeignKey
ALTER TABLE "SalaryOffer" ADD CONSTRAINT "SalaryOffer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryOffer" ADD CONSTRAINT "SalaryOffer_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "JobApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
