/**
 * AI Skills Extraction API
 * POST /api/ai/extract-skills - Extract skills from text (job description or resume)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";
import { jsonError, zodToDetails } from "@/lib/errors";
import { skillExtractionSchema } from "@/lib/validators/ai";
import { extractSkills, extractKeywords } from "@/lib/ai";
import { enforceRateLimitAsync } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Rate limit: 20 requests per minute
  const rlError = await enforceRateLimitAsync(req, "ai-extract-skills", 20, 60_000);
  if (rlError) return rlError;

  const { userId, error } = await requireUserOr401();
  if (error) return error;

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Invalid JSON body");
  }

  const parsed = skillExtractionSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));
  }

  const { text } = parsed.data;
  
  try {
    const skills = extractSkills(text);
    const keywords = extractKeywords(text, 15);
    
    return NextResponse.json({
      skills,
      keywords,
      meta: {
        aiProvider: 'local',
        tokensUsed: 0,
      }
    });
  } catch (err) {
    console.error('AI skills extraction error:', err);
    return jsonError(500, "INTERNAL_ERROR", "Failed to extract skills");
  }
}
