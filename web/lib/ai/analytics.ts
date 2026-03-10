/**
 * AI Usage Analytics Service
 * Provides statistics and insights about AI feature usage.
 * @module lib/ai/analytics
 */

import { prisma } from '@/lib/db';
import { AuditAction, AIModelCache, AIFeatureType } from '@prisma/client';

// AI-related audit actions
const AI_AUDIT_ACTIONS: AuditAction[] = [
  AuditAction.AI_TAGS_SUGGESTED,
  AuditAction.AI_RESUME_MATCHED,
  AuditAction.AI_INTERVIEW_QUESTIONS_GENERATED,
  AuditAction.AI_COVER_LETTER_GENERATED,
  AuditAction.AI_SALARY_ESTIMATED,
];

interface TimeRange {
  start: Date;
  end: Date;
}

interface UsageStats {
  totalRequests: number;
  uniqueUsers: number;
  requestsByFeature: Record<string, number>;
  requestsByDay: Array<{ date: string; count: number }>;
}

interface FeedbackStats {
  totalFeedback: number;
  positiveCount: number;
  negativeCount: number;
  averageRating: number | null;
  feedbackByFeature: Record<string, { positive: number; negative: number; neutral: number }>;
  recentFeedback: Array<{
    id: string;
    featureType: string;
    accepted: boolean;
    rating: number | null;
    feedback: string | null;
    createdAt: Date;
  }>;
}

interface ModelStats {
  cachedModels: number;
  lastTrainingTime: Date | null;
  modelsByType: Array<{
    modelType: string;
    updatedAt: Date;
    dataSize: number;
  }>;
}

/**
 * Gets AI usage statistics for a time range.
 */
export async function getAIUsageStats(
  timeRange?: TimeRange,
  userId?: string
): Promise<UsageStats> {
  const whereClause: Record<string, unknown> = {
    action: { in: AI_AUDIT_ACTIONS },
  };

  if (timeRange) {
    whereClause.createdAt = {
      gte: timeRange.start,
      lte: timeRange.end,
    };
  }

  if (userId) {
    whereClause.userId = userId;
  }

  // Total requests
  const totalRequests = await prisma.auditLog.count({
    where: whereClause,
  });

  // Unique users
  const uniqueUsersResult = await prisma.auditLog.groupBy({
    by: ['userId'],
    where: whereClause,
    _count: true,
  });
  const uniqueUsers = uniqueUsersResult.length;

  // Requests by feature
  const requestsByFeatureResult = await prisma.auditLog.groupBy({
    by: ['action'],
    where: whereClause,
    _count: {
      action: true,
    },
  });

  const requestsByFeature: Record<string, number> = {};
  for (const row of requestsByFeatureResult) {
    const featureName = getFeatureNameFromAction(row.action);
    requestsByFeature[featureName] = row._count.action;
  }

  // Requests by day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyLogs = await prisma.auditLog.findMany({
    where: {
      ...whereClause,
      createdAt: {
        gte: timeRange?.start || thirtyDaysAgo,
        lte: timeRange?.end || new Date(),
      },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Group by date
  const dailyCounts = new Map<string, number>();
  for (const log of dailyLogs) {
    const dateStr = log.createdAt.toISOString().split('T')[0];
    dailyCounts.set(dateStr, (dailyCounts.get(dateStr) || 0) + 1);
  }

  const requestsByDay = [...dailyCounts.entries()].map(([date, count]) => ({
    date,
    count,
  }));

  return {
    totalRequests,
    uniqueUsers,
    requestsByFeature,
    requestsByDay,
  };
}

/**
 * Gets AI feedback statistics.
 */
export async function getAIFeedbackStats(
  timeRange?: TimeRange,
  userId?: string
): Promise<FeedbackStats> {
  const whereClause: Record<string, unknown> = {};

  if (timeRange) {
    whereClause.createdAt = {
      gte: timeRange.start,
      lte: timeRange.end,
    };
  }

  if (userId) {
    whereClause.userId = userId;
  }

  // Total feedback count
  const totalFeedback = await prisma.aIFeedback.count({
    where: whereClause,
  });

  // Positive/negative counts
  const positiveCount = await prisma.aIFeedback.count({
    where: {
      ...whereClause,
      accepted: true,
    },
  });

  const negativeCount = await prisma.aIFeedback.count({
    where: {
      ...whereClause,
      accepted: false,
    },
  });

  // Average rating (where rating exists)
  const ratingAggResult = await prisma.aIFeedback.aggregate({
    where: {
      ...whereClause,
      rating: { not: null },
    },
    _avg: {
      rating: true,
    },
  });

  // Feedback by feature
  const feedbackByFeatureResult = await prisma.aIFeedback.groupBy({
    by: ['featureType', 'accepted'],
    where: whereClause,
    _count: {
      featureType: true,
    },
  });

  const feedbackByFeature: Record<string, { positive: number; negative: number; neutral: number }> = {};
  for (const row of feedbackByFeatureResult) {
    const featureKey = row.featureType as string;
    if (!feedbackByFeature[featureKey]) {
      feedbackByFeature[featureKey] = { positive: 0, negative: 0, neutral: 0 };
    }
    const count = row._count?.featureType || 0;
    if (row.accepted === true) {
      feedbackByFeature[featureKey].positive = count;
    } else if (row.accepted === false) {
      feedbackByFeature[featureKey].negative = count;
    } else {
      feedbackByFeature[featureKey].neutral = count;
    }
  }

  // Recent feedback
  const recentFeedbackData = await prisma.aIFeedback.findMany({
    where: whereClause,
    select: {
      id: true,
      featureType: true,
      accepted: true,
      rating: true,
      feedback: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 20,
  });

  const recentFeedback = recentFeedbackData.map((fb) => ({
    id: fb.id,
    featureType: fb.featureType as string,
    accepted: fb.accepted,
    rating: fb.rating,
    feedback: fb.feedback,
    createdAt: fb.createdAt,
  }));

  return {
    totalFeedback,
    positiveCount,
    negativeCount,
    averageRating: ratingAggResult._avg.rating,
    feedbackByFeature,
    recentFeedback,
  };
}

/**
 * Gets AI model cache statistics.
 */
export async function getAIModelStats(): Promise<ModelStats> {
  const cachedModels = await prisma.aIModelCache.count();

  const models = await prisma.aIModelCache.findMany({
    select: {
      modelType: true,
      updatedAt: true,
      modelData: true,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  const lastTrainingTime = models.length > 0 ? models[0].updatedAt : null;

  const modelsByType = models.map((m) => ({
    modelType: m.modelType,
    updatedAt: m.updatedAt,
    dataSize: JSON.stringify(m.modelData).length,
  }));

  return {
    cachedModels,
    lastTrainingTime,
    modelsByType,
  };
}

/**
 * Gets comprehensive AI analytics dashboard data.
 */
export async function getAIDashboardAnalytics(
  timeRange?: TimeRange
): Promise<{
  usage: UsageStats;
  feedback: FeedbackStats;
  models: ModelStats;
  summary: {
    totalAIRequests: number;
    acceptanceRate: number;
    averageRating: number | null;
    mostUsedFeature: string | null;
    leastUsedFeature: string | null;
  };
}> {
  const [usage, feedback, models] = await Promise.all([
    getAIUsageStats(timeRange),
    getAIFeedbackStats(timeRange),
    getAIModelStats(),
  ]);

  // Calculate summary
  const acceptanceRate =
    feedback.totalFeedback > 0
      ? Math.round((feedback.positiveCount / feedback.totalFeedback) * 100)
      : 0;

  const featureUsages = Object.entries(usage.requestsByFeature);
  featureUsages.sort((a, b) => b[1] - a[1]);

  const mostUsedFeature = featureUsages.length > 0 ? featureUsages[0][0] : null;
  const leastUsedFeature =
    featureUsages.length > 0 ? featureUsages[featureUsages.length - 1][0] : null;

  return {
    usage,
    feedback,
    models,
    summary: {
      totalAIRequests: usage.totalRequests,
      acceptanceRate,
      averageRating: feedback.averageRating,
      mostUsedFeature,
      leastUsedFeature,
    },
  };
}

/**
 * Gets user-specific AI analytics.
 */
export async function getUserAIAnalytics(userId: string): Promise<{
  totalRequests: number;
  feedbackGiven: number;
  acceptanceRate: number;
  featureUsage: Record<string, number>;
  recentActivity: Array<{
    action: string;
    timestamp: Date;
  }>;
}> {
  // User's total AI requests
  const totalRequests = await prisma.auditLog.count({
    where: {
      userId,
      action: { in: AI_AUDIT_ACTIONS },
    },
  });

  // User's feedback
  const feedbackCount = await prisma.aIFeedback.count({
    where: { userId },
  });

  const acceptedCount = await prisma.aIFeedback.count({
    where: { userId, accepted: true },
  });

  const acceptanceRate =
    feedbackCount > 0 ? Math.round((acceptedCount / feedbackCount) * 100) : 0;

  // Feature usage breakdown
  const featureUsageResult = await prisma.auditLog.groupBy({
    by: ['action'],
    where: {
      userId,
      action: { in: AI_AUDIT_ACTIONS },
    },
    _count: { action: true },
  });

  const featureUsage: Record<string, number> = {};
  for (const row of featureUsageResult) {
    const featureName = getFeatureNameFromAction(row.action);
    featureUsage[featureName] = row._count.action;
  }

  // Recent activity
  const recentLogs = await prisma.auditLog.findMany({
    where: {
      userId,
      action: { in: AI_AUDIT_ACTIONS },
    },
    select: {
      action: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const recentActivity = recentLogs.map((log) => ({
    action: getFeatureNameFromAction(log.action),
    timestamp: log.createdAt,
  }));

  return {
    totalRequests,
    feedbackGiven: feedbackCount,
    acceptanceRate,
    featureUsage,
    recentActivity,
  };
}

/**
 * Maps audit action to user-friendly feature name.
 */
function getFeatureNameFromAction(action: AuditAction): string {
  const actionMap: Partial<Record<AuditAction, string>> = {
    [AuditAction.AI_TAGS_SUGGESTED]: 'Tag Suggestions',
    [AuditAction.AI_RESUME_MATCHED]: 'Resume Analysis',
    [AuditAction.AI_INTERVIEW_QUESTIONS_GENERATED]: 'Interview Questions',
    [AuditAction.AI_COVER_LETTER_GENERATED]: 'Cover Letter',
    [AuditAction.AI_SALARY_ESTIMATED]: 'Salary Estimate',
  };

  return actionMap[action] || action;
}

/**
 * Exports analytics data as CSV.
 */
export async function exportAnalyticsCSV(timeRange?: TimeRange): Promise<string> {
  const analytics = await getAIDashboardAnalytics(timeRange);

  const lines: string[] = [
    'AI Analytics Export',
    `Generated: ${new Date().toISOString()}`,
    '',
    'Summary',
    `Total AI Requests,${analytics.summary.totalAIRequests}`,
    `Acceptance Rate,${analytics.summary.acceptanceRate}%`,
    `Average Rating,${analytics.summary.averageRating?.toFixed(1) || 'N/A'}`,
    `Most Used Feature,${analytics.summary.mostUsedFeature || 'N/A'}`,
    '',
    'Usage by Feature',
    'Feature,Count',
    ...Object.entries(analytics.usage.requestsByFeature).map(
      ([feature, count]) => `${feature},${count}`
    ),
    '',
    'Daily Usage (Last 30 Days)',
    'Date,Count',
    ...analytics.usage.requestsByDay.map((day) => `${day.date},${day.count}`),
    '',
    'Feedback by Feature',
    'Feature,Positive,Negative,Neutral',
    ...Object.entries(analytics.feedback.feedbackByFeature).map(
      ([feature, stats]) =>
        `${feature},${stats.positive},${stats.negative},${stats.neutral}`
    ),
  ];

  return lines.join('\n');
}
