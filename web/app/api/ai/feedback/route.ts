/**
 * AI Feedback API - Collects user feedback on AI suggestions for training
 * POST /api/ai/feedback - Submit feedback
 * GET /api/ai/feedback - Get feedback history (for debugging/admin)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";
import { jsonError, zodToDetails } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { AuditAction, AIFeatureType } from "@prisma/client";
import { audit } from "@/lib/audit";
import { enforceRateLimitAsync } from "@/lib/rateLimit";
import { z } from "zod";

const feedbackSchema = z.object({
  featureType: z.enum([
    "TAG_SUGGESTION",
    "RESUME_MATCH",
    "INTERVIEW_QUESTIONS",
    "COVER_LETTER",
    "SALARY_ESTIMATE",
    "FOLLOW_UP_TIMING",
  ]),
  inputText: z.string().max(10000).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
  suggestion: z.string().min(1).max(5000),
  accepted: z.boolean(),
  rating: z.number().int().min(1).max(5).optional(),
  feedback: z.string().max(1000).optional(),
  correctedTo: z.string().max(5000).optional(),
});

export async function POST(req: NextRequest) {
  // Rate limit: 30 feedback submissions per minute
  const rlError = await enforceRateLimitAsync(req, "ai-feedback", 30, 60_000);
  if (rlError) return rlError;

  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const parsed = feedbackSchema.safeParse(await req.json());
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid feedback data", zodToDetails(parsed.error));
  }

  const { featureType, inputText, context, suggestion, accepted, rating, feedback, correctedTo } = parsed.data;

  // Store feedback
  const feedbackRecord = await prisma.aIFeedback.create({
    data: {
      userId,
      featureType: featureType as AIFeatureType,
      inputText,
      context: context ? JSON.parse(JSON.stringify(context)) : undefined,
      suggestion,
      accepted,
      rating,
      feedback,
      correctedTo,
    },
  });

  // Audit the feedback submission
  await audit(req, userId, AuditAction.AI_FEEDBACK_SUBMITTED, {
    entity: "AIFeedback",
    entityId: feedbackRecord.id,
    meta: { featureType, accepted, rating },
  });

  return NextResponse.json(
    { 
      success: true,
      message: "Feedback recorded. Thank you for helping improve our AI!",
      feedbackId: feedbackRecord.id,
    },
    { status: 201 }
  );
}

export async function GET(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const url = new URL(req.url);
  const featureType = url.searchParams.get("featureType") as AIFeatureType | null;
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);

  const feedback = await prisma.aIFeedback.findMany({
    where: {
      userId,
      ...(featureType ? { featureType } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      featureType: true,
      suggestion: true,
      accepted: true,
      rating: true,
      feedback: true,
      createdAt: true,
    },
  });

  // Calculate some stats
  const stats = await prisma.aIFeedback.groupBy({
    by: ["featureType", "accepted"],
    where: { userId },
    _count: true,
  });

  const statsByFeature: Record<string, { accepted: number; rejected: number }> = {};
  for (const stat of stats) {
    if (!statsByFeature[stat.featureType]) {
      statsByFeature[stat.featureType] = { accepted: 0, rejected: 0 };
    }
    if (stat.accepted) {
      statsByFeature[stat.featureType].accepted = stat._count;
    } else {
      statsByFeature[stat.featureType].rejected = stat._count;
    }
  }

  return NextResponse.json({ feedback, stats: statsByFeature });
}
