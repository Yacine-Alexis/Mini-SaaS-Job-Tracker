-- CreateEnum
CREATE TYPE "AIFeatureType" AS ENUM ('TAG_SUGGESTION', 'RESUME_MATCH', 'INTERVIEW_QUESTIONS', 'COVER_LETTER', 'SALARY_ESTIMATE', 'FOLLOW_UP_TIMING');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'AI_TAGS_SUGGESTED';
ALTER TYPE "AuditAction" ADD VALUE 'AI_RESUME_MATCHED';
ALTER TYPE "AuditAction" ADD VALUE 'AI_INTERVIEW_QUESTIONS_GENERATED';
ALTER TYPE "AuditAction" ADD VALUE 'AI_COVER_LETTER_GENERATED';
ALTER TYPE "AuditAction" ADD VALUE 'AI_SALARY_ESTIMATED';
ALTER TYPE "AuditAction" ADD VALUE 'AI_INSIGHTS_VIEWED';
ALTER TYPE "AuditAction" ADD VALUE 'AI_FEEDBACK_SUBMITTED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "image" TEXT,
ADD COLUMN     "name" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIFeedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "featureType" "AIFeatureType" NOT NULL,
    "inputText" TEXT,
    "context" JSONB,
    "suggestion" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL,
    "rating" INTEGER,
    "feedback" TEXT,
    "correctedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIModelCache" (
    "id" TEXT NOT NULL,
    "modelType" TEXT NOT NULL,
    "userId" TEXT,
    "modelData" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "accuracy" DOUBLE PRECISION,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIModelCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "AIFeedback_userId_featureType_idx" ON "AIFeedback"("userId", "featureType");

-- CreateIndex
CREATE INDEX "AIFeedback_featureType_accepted_idx" ON "AIFeedback"("featureType", "accepted");

-- CreateIndex
CREATE INDEX "AIFeedback_createdAt_idx" ON "AIFeedback"("createdAt");

-- CreateIndex
CREATE INDEX "AIModelCache_modelType_idx" ON "AIModelCache"("modelType");

-- CreateIndex
CREATE UNIQUE INDEX "AIModelCache_modelType_userId_key" ON "AIModelCache"("modelType", "userId");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
