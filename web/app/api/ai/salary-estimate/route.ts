/**
 * AI Salary Estimation API
 * POST /api/ai/salary-estimate - Estimate salary range for a job
 * PRO ONLY: This feature requires a Pro subscription
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";
import { jsonError, zodToDetails } from "@/lib/errors";
import { salaryEstimateSchema } from "@/lib/validators/ai";
import { estimateSalary, generateCacheKey, getFromCache, setInCache, AI_CACHE_TTLS } from "@/lib/ai";
import { enforceRateLimitAsync } from "@/lib/rateLimit";
import { audit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";
import { getUserPlan, isPro } from "@/lib/plan";
import type { SalaryEstimate } from "@/lib/ai";

export async function POST(req: NextRequest) {
  // Rate limit: 10 requests per minute
  const rlError = await enforceRateLimitAsync(req, "ai-salary-estimate", 10, 60_000);
  if (rlError) return rlError;

  const { userId, error } = await requireUserOr401();
  if (error) return error;

  // Pro-only feature
  const plan = await getUserPlan(userId);
  if (!isPro(plan)) {
    return jsonError(403, "PLAN_REQUIRED", "Salary estimation requires a Pro subscription. Upgrade to unlock this feature.");
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Invalid JSON body");
  }

  const parsed = salaryEstimateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));
  }

  const { jobTitle, jobDescription, location, experienceYears } = parsed.data;
  
  try {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = generateCacheKey('salary', jobTitle, location, experienceYears);
    let estimate = getFromCache<SalaryEstimate>(cacheKey);
    let cached = false;
    
    if (!estimate) {
      estimate = estimateSalary(jobTitle, jobDescription, location, experienceYears);
      setInCache(cacheKey, estimate, AI_CACHE_TTLS.SALARY_ESTIMATE);
    } else {
      cached = true;
    }
    
    const processingTimeMs = Date.now() - startTime;
    
    // Audit AI usage
    await audit(req, userId, AuditAction.AI_SALARY_ESTIMATED, {
      meta: { jobTitle, location, processingTimeMs, cached }
    });
    
    return NextResponse.json({
      estimate,
      meta: {
        aiProvider: 'local',
        tokensUsed: 0,
        processingTimeMs,
        cached,
      }
    });
  } catch (err) {
    console.error('AI salary estimate error:', err);
    return jsonError(500, "INTERNAL_ERROR", "Failed to estimate salary");
  }
}
