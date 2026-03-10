/**
 * AI Analytics API
 * Returns AI usage statistics and dashboard data.
 * @route GET /api/ai/analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireUserOr401 } from '@/lib/auth';
import { jsonError } from '@/lib/errors';
import { getUserPlan, isPro } from '@/lib/plan';
import { getAIDashboardAnalytics, getUserAIAnalytics, exportAnalyticsCSV } from '@/lib/ai';

export async function GET(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const scope = searchParams.get('scope') || 'user'; // 'user' or 'admin'
  const format = searchParams.get('format'); // 'csv' for export
  const startDate = searchParams.get('start');
  const endDate = searchParams.get('end');

  // Build time range if provided
  const timeRange = startDate && endDate
    ? {
        start: new Date(startDate),
        end: new Date(endDate),
      }
    : undefined;

  // User-specific analytics (available to all users)
  if (scope === 'user') {
    const analytics = await getUserAIAnalytics(userId);
    return NextResponse.json({ analytics });
  }

  // Admin/full analytics (Pro only)
  const plan = await getUserPlan(userId);
  if (!isPro(plan)) {
    return jsonError(403, 'PLAN_LIMIT', 'Full AI analytics is a Pro feature. Upgrade to access.');
  }

  // CSV export
  if (format === 'csv') {
    const csv = await exportAnalyticsCSV(timeRange);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="ai-analytics-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  }

  // Dashboard analytics
  const analytics = await getAIDashboardAnalytics(timeRange);
  return NextResponse.json({ analytics });
}
