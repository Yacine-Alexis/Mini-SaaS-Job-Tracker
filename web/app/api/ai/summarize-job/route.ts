/**
 * AI Job Summary API
 * POST /api/ai/summarize-job - Summarize a job description
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";
import { jsonError, zodToDetails } from "@/lib/errors";
import { jobSummarySchema } from "@/lib/validators/ai";
import { summarizeJobDescription, extractSkills, detectIndustry, extractExperienceYears } from "@/lib/ai";
import { enforceRateLimitAsync } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Rate limit: 15 requests per minute
  const rlError = await enforceRateLimitAsync(req, "ai-summarize-job", 15, 60_000);
  if (rlError) return rlError;

  const { userId, error } = await requireUserOr401();
  if (error) return error;

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Invalid JSON body");
  }

  const parsed = jobSummarySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));
  }

  const { jobDescription } = parsed.data;
  
  try {
    const summary = summarizeJobDescription(jobDescription);
    const skills = extractSkills(jobDescription);
    const industry = detectIndustry(jobDescription);
    const experience = extractExperienceYears(jobDescription);
    
    return NextResponse.json({
      summary,
      analysis: {
        topSkills: skills.slice(0, 10),
        industry,
        experienceRequired: experience,
      },
      meta: {
        aiProvider: 'local',
        tokensUsed: 0,
      }
    });
  } catch (err) {
    console.error('AI job summary error:', err);
    return jsonError(500, "INTERNAL_ERROR", "Failed to summarize job");
  }
}
