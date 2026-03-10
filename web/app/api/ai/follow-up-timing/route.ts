/**
 * AI Follow-up Timing Recommendation API
 * POST /api/ai/follow-up-timing - Get recommended follow-up timing
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";
import { jsonError, zodToDetails } from "@/lib/errors";
import { followUpTimingSchema } from "@/lib/validators/ai";
import { recommendFollowUpTiming } from "@/lib/ai";
import { enforceRateLimitAsync } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Rate limit: 20 requests per minute
  const rlError = await enforceRateLimitAsync(req, "ai-follow-up", 20, 60_000);
  if (rlError) return rlError;

  const { userId, error } = await requireUserOr401();
  if (error) return error;

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Invalid JSON body");
  }

  const parsed = followUpTimingSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));
  }

  const { appliedDate, stage, hasRecruiterContact, industry } = parsed.data;
  
  try {
    const recommendation = recommendFollowUpTiming(
      new Date(appliedDate),
      stage,
      hasRecruiterContact,
      industry
    );
    
    return NextResponse.json({
      recommendation: {
        ...recommendation,
        recommendedDate: recommendation.recommendedDate.toISOString(),
      },
      meta: {
        aiProvider: 'local',
        tokensUsed: 0,
      }
    });
  } catch (err) {
    console.error('AI follow-up timing error:', err);
    return jsonError(500, "INTERNAL_ERROR", "Failed to calculate follow-up timing");
  }
}
