/**
 * AI Recommendations API
 * Returns job recommendations and similar jobs.
 * @route GET /api/ai/recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireUserOr401 } from '@/lib/auth';
import { jsonError } from '@/lib/errors';
import { audit } from '@/lib/audit';
import { AuditAction } from '@prisma/client';
import {
  getJobRecommendations,
  findSimilarJobs,
  getApplicationInsights,
} from '@/lib/ai';

export async function GET(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'recommendations'; // 'recommendations', 'similar', 'insights'
  const applicationId = searchParams.get('applicationId');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 10;

  try {
    switch (type) {
      case 'recommendations': {
        const result = await getJobRecommendations(userId, limit);
        await audit(req, userId, AuditAction.AI_INSIGHTS_VIEWED, {
          entity: 'Recommendations',
          meta: { count: result.recommendations.length },
        });
        return NextResponse.json(result);
      }

      case 'similar': {
        if (!applicationId) {
          return jsonError(400, 'MISSING_PARAM', 'applicationId is required for similar jobs');
        }
        const similarJobs = await findSimilarJobs(userId, applicationId, limit);
        return NextResponse.json({ similarJobs });
      }

      case 'insights': {
        const insights = await getApplicationInsights(userId);
        return NextResponse.json({ insights });
      }

      default:
        return jsonError(400, 'INVALID_TYPE', `Unknown type: ${type}`);
    }
  } catch (err) {
    console.error('[AI Recommendations Error]', err);
    return jsonError(500, 'AI_ERROR', 'Failed to generate recommendations');
  }
}
