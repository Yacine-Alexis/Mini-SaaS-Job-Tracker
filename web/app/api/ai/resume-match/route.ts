/**
 * AI Resume Match Analysis API
 * POST /api/ai/resume-match - Analyze how well a resume matches a job description
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";
import { jsonError, zodToDetails } from "@/lib/errors";
import { resumeMatchSchema } from "@/lib/validators/ai";
import { analyzeResumeMatch } from "@/lib/ai";
import { enforceRateLimitAsync } from "@/lib/rateLimit";
import { audit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";

export async function POST(req: NextRequest) {
  // Rate limit: 10 requests per minute (more expensive operation)
  const rlError = await enforceRateLimitAsync(req, "ai-resume-match", 10, 60_000);
  if (rlError) return rlError;

  const { userId, error } = await requireUserOr401();
  if (error) return error;

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Invalid JSON body");
  }

  const parsed = resumeMatchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));
  }

  const { jobDescription, resume, jobTitle } = parsed.data;
  
  try {
    const startTime = Date.now();
    const result = analyzeResumeMatch(jobDescription, resume, jobTitle);
    const processingTimeMs = Date.now() - startTime;
    
    // Audit AI usage
    await audit(req, userId, AuditAction.AI_RESUME_MATCHED, {
      meta: { matchScore: result.score, processingTimeMs }
    });
    
    return NextResponse.json({
      match: result,
      meta: {
        aiProvider: 'local',
        tokensUsed: 0,
        processingTimeMs,
      }
    });
  } catch (err) {
    console.error('AI resume match error:', err);
    return jsonError(500, "INTERNAL_ERROR", "Failed to analyze resume match");
  }
}
