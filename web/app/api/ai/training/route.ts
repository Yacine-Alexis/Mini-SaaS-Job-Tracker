/**
 * AI Training API
 * Handles model training and retraining operations.
 * @route POST /api/ai/training
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireUserOr401 } from '@/lib/auth';
import { jsonError } from '@/lib/errors';
import { getUserPlan, isPro } from '@/lib/plan';
import { audit } from '@/lib/audit';
import { AuditAction } from '@prisma/client';
import {
  autoRetrainAll,
  shouldRetrain,
  getTrainingStats,
} from '@/lib/ai';

/**
 * GET - Get training status and statistics
 */
export async function GET(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  // Check Pro access for training stats
  const plan = await getUserPlan(userId);
  if (!isPro(plan)) {
    return jsonError(403, 'PLAN_LIMIT', 'AI training features are Pro-only.');
  }

  const { searchParams } = new URL(req.url);
  const modelType = searchParams.get('modelType') || 'tag_classifier';

  try {
    const [needsRetrain, stats] = await Promise.all([
      shouldRetrain(modelType),
      getTrainingStats(),
    ]);

    return NextResponse.json({
      modelType,
      needsRetrain,
      stats,
    });
  } catch (err) {
    console.error('[AI Training Status Error]', err);
    return jsonError(500, 'AI_ERROR', 'Failed to get training status');
  }
}

/**
 * POST - Trigger model retraining
 */
export async function POST(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  // Check Pro access
  const plan = await getUserPlan(userId);
  if (!isPro(plan)) {
    return jsonError(403, 'PLAN_LIMIT', 'AI training features are Pro-only.');
  }

  const body = await req.json().catch(() => ({}));
  const { modelType } = body; // Optional: specific model to retrain

  try {
    // Run auto-retrain for all models or specific model
    const results = await autoRetrainAll();

    await audit(req, userId, AuditAction.AI_INSIGHTS_VIEWED, {
      entity: 'Training',
      meta: { operation: 'retrain', modelType: modelType || 'all', results },
    });

    return NextResponse.json({
      success: true,
      message: 'Model retraining completed',
      results,
    });
  } catch (err) {
    console.error('[AI Training Error]', err);
    return jsonError(500, 'AI_ERROR', 'Failed to retrain models');
  }
}
