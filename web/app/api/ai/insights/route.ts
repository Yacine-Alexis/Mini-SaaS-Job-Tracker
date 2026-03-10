/**
 * AI Application Insights API
 * GET /api/ai/insights - Get AI-powered insights on user's applications
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";
import { jsonError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { generateApplicationInsights } from "@/lib/ai";
import { enforceRateLimitAsync } from "@/lib/rateLimit";
import { audit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";

export async function GET(req: NextRequest) {
  // Rate limit: 10 requests per minute
  const rlError = await enforceRateLimitAsync(req, "ai-insights", 10, 60_000);
  if (rlError) return rlError;

  const { userId, error } = await requireUserOr401();
  if (error) return error;

  try {
    const startTime = Date.now();
    
    // Fetch user's applications
    const applications = await prisma.jobApplication.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      select: {
        id: true,
        company: true,
        title: true,
        stage: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        tags: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform data for insights generator
    const formattedApplications = applications.map(app => ({
      id: app.id,
      company: app.company,
      title: app.title,
      stage: app.stage,
      description: app.description ?? undefined,
      appliedAt: app.createdAt,
      updatedAt: app.updatedAt,
      tags: app.tags,
    }));

    const insights = generateApplicationInsights(formattedApplications);
    const processingTimeMs = Date.now() - startTime;
    
    // Audit AI usage
    await audit(req, userId, AuditAction.AI_INSIGHTS_VIEWED, {
      meta: { applicationCount: applications.length, processingTimeMs }
    });
    
    return NextResponse.json({
      insights,
      meta: {
        aiProvider: 'local',
        tokensUsed: 0,
        applicationCount: applications.length,
        processingTimeMs,
      }
    });
  } catch (err) {
    console.error('AI insights error:', err);
    return jsonError(500, "INTERNAL_ERROR", "Failed to generate insights");
  }
}
