/**
 * AI Cover Letter Generator API
 * POST /api/ai/cover-letter - Generate a cover letter based on job and resume
 * PRO ONLY: This feature requires a Pro subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";
import { jsonError, zodToDetails } from "@/lib/errors";
import { coverLetterSchema } from "@/lib/validators/ai";
import { generateCoverLetter } from "@/lib/ai";
import { enforceRateLimitAsync } from "@/lib/rateLimit";
import { audit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";
import { getUserPlan, isPro } from "@/lib/plan";

export async function POST(req: NextRequest) {
  // Rate limit: 5 requests per minute (expensive operation)
  const rlError = await enforceRateLimitAsync(req, "ai-cover-letter", 5, 60_000);
  if (rlError) return rlError;

  const { userId, error } = await requireUserOr401();
  if (error) return error;

  // Pro-only feature
  const plan = await getUserPlan(userId);
  if (!isPro(plan)) {
    return jsonError(403, "PLAN_REQUIRED", "Cover letter generation requires a Pro subscription. Upgrade to unlock this feature.");
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Invalid JSON body");
  }

  const parsed = coverLetterSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));
  }

  const { jobDescription, jobTitle, companyName, resume, tone, length, emphasisPoints } = parsed.data;
  
  try {
    const startTime = Date.now();
    const coverLetter = generateCoverLetter(
      jobDescription,
      jobTitle,
      companyName,
      resume,
      { tone, length, emphasisPoints }
    );
    const processingTimeMs = Date.now() - startTime;
    
    // Audit AI usage
    await audit(req, userId, AuditAction.AI_COVER_LETTER_GENERATED, {
      meta: { tone, length, processingTimeMs }
    });
    
    return NextResponse.json({
      coverLetter,
      meta: {
        aiProvider: 'local',
        tokensUsed: coverLetter.tokensUsed,
        processingTimeMs,
      }
    });
  } catch (err) {
    console.error('AI cover letter error:', err);
    return jsonError(500, "INTERNAL_ERROR", "Failed to generate cover letter");
  }
}
