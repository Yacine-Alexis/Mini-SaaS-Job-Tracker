/**
 * AI Interview Questions Generator API
 * POST /api/ai/interview-questions - Generate interview questions based on job
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";
import { jsonError, zodToDetails } from "@/lib/errors";
import { interviewQuestionsSchema } from "@/lib/validators/ai";
import { generateInterviewQuestions, generateCacheKey, getFromCache, setInCache, AI_CACHE_TTLS } from "@/lib/ai";
import { enforceRateLimitAsync } from "@/lib/rateLimit";
import { audit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";
import type { InterviewQuestion } from "@/lib/ai";

export async function POST(req: NextRequest) {
  // Rate limit: 15 requests per minute
  const rlError = await enforceRateLimitAsync(req, "ai-interview-questions", 15, 60_000);
  if (rlError) return rlError;

  const { userId, error } = await requireUserOr401();
  if (error) return error;

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Invalid JSON body");
  }

  const parsed = interviewQuestionsSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));
  }

  const { jobDescription, jobTitle, interviewType, count } = parsed.data;
  
  try {
    const startTime = Date.now();
    
    // Check cache first (based on job title, type, and count - not full description)
    const cacheKey = generateCacheKey('interview', jobTitle, interviewType, count);
    let questions = getFromCache<InterviewQuestion[]>(cacheKey);
    let cached = false;
    
    if (!questions) {
      questions = generateInterviewQuestions(
        jobDescription, 
        jobTitle, 
        interviewType,
        count
      );
      setInCache(cacheKey, questions, AI_CACHE_TTLS.INTERVIEW_QUESTIONS);
    } else {
      cached = true;
    }
    
    const processingTimeMs = Date.now() - startTime;
    
    // Audit AI usage
    await audit(req, userId, AuditAction.AI_INTERVIEW_QUESTIONS_GENERATED, {
      meta: { questionCount: questions.length, interviewType, processingTimeMs, cached }
    });
    
    return NextResponse.json({
      questions,
      meta: {
        aiProvider: 'local',
        tokensUsed: 0,
        questionCount: questions.length,
        processingTimeMs,
        cached,
      }
    });
  } catch (err) {
    console.error('AI interview questions error:', err);
    return jsonError(500, "INTERNAL_ERROR", "Failed to generate interview questions");
  }
}
