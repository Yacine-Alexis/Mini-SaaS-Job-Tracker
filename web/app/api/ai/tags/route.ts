/**
 * AI Tag Suggestion API
 * POST /api/ai/tags - Get AI-suggested tags for a job application
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";
import { jsonError, zodToDetails } from "@/lib/errors";
import { tagSuggestionSchema } from "@/lib/validators/ai";
import { suggestTags } from "@/lib/ai";
import { enforceRateLimitAsync } from "@/lib/rateLimit";
import { audit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";

export async function POST(req: NextRequest) {
  // Rate limit: 20 requests per minute
  const rlError = await enforceRateLimitAsync(req, "ai-tags", 20, 60_000);
  if (rlError) return rlError;

  const { userId, error } = await requireUserOr401();
  if (error) return error;

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Invalid JSON body");
  }

  const parsed = tagSuggestionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));
  }

  const { jobDescription, jobTitle, company } = parsed.data;
  
  try {
    const startTime = Date.now();
    const suggestions = suggestTags(jobDescription, jobTitle, company);
    const processingTimeMs = Date.now() - startTime;
    
    // Audit AI usage
    await audit(req, userId, AuditAction.AI_TAGS_SUGGESTED, {
      meta: { suggestionsCount: suggestions.length, processingTimeMs }
    });
    
    return NextResponse.json({
      suggestions,
      meta: {
        aiProvider: 'local',
        tokensUsed: 0,
        processingTimeMs,
      }
    });
  } catch (err) {
    console.error('AI tag suggestion error:', err);
    return jsonError(500, "INTERNAL_ERROR", "Failed to generate tag suggestions");
  }
}
