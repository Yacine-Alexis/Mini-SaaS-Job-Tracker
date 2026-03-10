/**
 * AI Assistant API - Natural language job search assistant.
 * POST: Ask the assistant a question
 * GET: Get quick insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireUserOr401 } from '@/lib/auth';
import { jsonError, zodToDetails } from '@/lib/errors';
import { z } from 'zod';
import { askAssistant, getQuickInsights } from '@/lib/ai/assistant';
import { audit } from '@/lib/audit';
import { AuditAction } from '@prisma/client';

const askSchema = z.object({
  query: z.string().min(1).max(1000),
});

/**
 * POST /api/ai/assistant - Ask the AI assistant a question
 */
export async function POST(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const parsed = askSchema.safeParse(body);

  if (!parsed.success) {
    return jsonError(400, 'VALIDATION_ERROR', 'Invalid query', zodToDetails(parsed.error));
  }

  try {
    const response = await askAssistant(userId, parsed.data.query);

    // Audit the interaction
    await audit(req, userId, AuditAction.AI_INSIGHTS_VIEWED, {
      meta: {
        action: 'assistant_query',
        queryLength: parsed.data.query.length,
        responseType: response.type,
      },
    });

    return NextResponse.json(response);
  } catch (err) {
    console.error('AI Assistant error:', err);
    return jsonError(500, 'AI_ERROR', 'Failed to process your question');
  }
}

/**
 * GET /api/ai/assistant - Get quick insights for dashboard
 */
export async function GET(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  try {
    const insights = await getQuickInsights(userId);
    return NextResponse.json({ insights });
  } catch (err) {
    console.error('Quick insights error:', err);
    return jsonError(500, 'AI_ERROR', 'Failed to get insights');
  }
}
