/**
 * AI Job Comparison API
 * POST /api/ai/compare-jobs - Compare two job descriptions
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";
import { jsonError, zodToDetails } from "@/lib/errors";
import { jobComparisonSchema } from "@/lib/validators/ai";
import { compareJobs } from "@/lib/ai";
import { TFIDFProcessor } from "@/lib/ai/tfidf";
import { enforceRateLimitAsync } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Rate limit: 10 requests per minute (more expensive operation)
  const rlError = await enforceRateLimitAsync(req, "ai-compare-jobs", 10, 60_000);
  if (rlError) return rlError;

  const { userId, error } = await requireUserOr401();
  if (error) return error;

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Invalid JSON body");
  }

  const parsed = jobComparisonSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));
  }

  const { job1, job2 } = parsed.data;
  
  try {
    const similarityScore = compareJobs(job1, job2);
    
    // Get detailed comparison
    const processor = new TFIDFProcessor();
    processor.addDocuments([
      { id: 'job1', content: job1 },
      { id: 'job2', content: job2 },
    ]);
    
    const details = processor.compareTwoTexts(job1, job2);
    
    return NextResponse.json({
      similarityScore,
      details: {
        cosineSimilarity: Math.round(details.cosineSimilarity * 100),
        jaccardSimilarity: Math.round(details.jaccardSimilarity * 100),
        commonTerms: details.commonTerms.slice(0, 20),
        uniqueToFirst: details.uniqueToFirst.slice(0, 10),
        uniqueToSecond: details.uniqueToSecond.slice(0, 10),
      },
      meta: {
        aiProvider: 'local',
        tokensUsed: 0,
      }
    });
  } catch (err) {
    console.error('AI job comparison error:', err);
    return jsonError(500, "INTERNAL_ERROR", "Failed to compare jobs");
  }
}
