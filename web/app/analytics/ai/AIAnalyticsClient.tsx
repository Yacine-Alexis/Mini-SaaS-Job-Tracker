'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
    createdAt: string;
  }>;
}

interface ModelStats {
  cachedModels: number;
  lastTrainingTime: string | null;
  modelsByType: Array<{
    modelType: string;
    updatedAt: string;
    dataSize: number;
  }>;
}

interface DashboardAnalytics {
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
}

interface TrainingStats {
  modelType: string;
  needsRetrain: boolean;
  stats: {
    totalFeedback: number;
    lastTrainingTime: string | null;
    modelsInCache: number;
  };
}

export default function AIAnalyticsClient() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [trainingStats, setTrainingStats] = useState<TrainingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retraining, setRetraining] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchAnalytics();
    fetchTrainingStats();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(
        `/api/ai/analytics?scope=admin&start=${dateRange.start}&end=${dateRange.end}`
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to fetch analytics');
      }
      const data = await res.json();
      setAnalytics(data.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainingStats = async () => {
    try {
      const res = await fetch('/api/ai/training');
      if (res.ok) {
        const data = await res.json();
        setTrainingStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch training stats:', err);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      const res = await fetch('/api/ai/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to retrain models');
      }
      
      // Refresh stats after retraining
      await fetchTrainingStats();
      alert('Models retrained successfully!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to retrain models');
    } finally {
      setRetraining(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetch(
        `/api/ai/analytics?scope=admin&format=csv&start=${dateRange.start}&end=${dateRange.end}`
      );
      if (!res.ok) throw new Error('Failed to export');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-analytics-${dateRange.start}-to-${dateRange.end}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert('Failed to export CSV');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Access Denied
            </h2>
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <Link
              href="/dashboard"
              className="inline-block mt-4 text-blue-600 dark:text-blue-400 hover:underline"
            >
              &larr; Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Monitor AI feature usage and performance
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Export CSV
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              &larr; Dashboard
            </Link>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Date Range:
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total AI Requests
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {analytics.summary.totalAIRequests.toLocaleString()}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Acceptance Rate
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
              {analytics.summary.acceptanceRate}%
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Average Rating
            </h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
              {analytics.summary.averageRating?.toFixed(1) || 'N/A'}
              {analytics.summary.averageRating && <span className="text-lg">/5</span>}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Unique Users
            </h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-2">
              {analytics.usage.uniqueUsers}
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Feature Usage */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Usage by Feature
            </h3>
            <div className="space-y-3">
              {Object.entries(analytics.usage.requestsByFeature).map(([feature, count]) => {
                const maxCount = Math.max(...Object.values(analytics.usage.requestsByFeature));
                const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                
                return (
                  <div key={feature}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      <span className="text-gray-500 dark:text-gray-400">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {Object.keys(analytics.usage.requestsByFeature).length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No usage data available
                </p>
              )}
            </div>
          </div>

          {/* Feedback Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Feedback Distribution
            </h3>
            <div className="space-y-4">
              {Object.entries(analytics.feedback.feedbackByFeature).map(([feature, stats]) => {
                const total = stats.positive + stats.negative + stats.neutral;
                
                return (
                  <div key={feature}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      <span className="text-gray-500 dark:text-gray-400">{total} total</span>
                    </div>
                    <div className="flex h-4 rounded-full overflow-hidden">
                      {total > 0 && (
                        <>
                          <div
                            className="bg-green-500"
                            style={{ width: `${(stats.positive / total) * 100}%` }}
                            title={`Positive: ${stats.positive}`}
                          />
                          <div
                            className="bg-gray-400"
                            style={{ width: `${(stats.neutral / total) * 100}%` }}
                            title={`Neutral: ${stats.neutral}`}
                          />
                          <div
                            className="bg-red-500"
                            style={{ width: `${(stats.negative / total) * 100}%` }}
                            title={`Negative: ${stats.negative}`}
                          />
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {Object.keys(analytics.feedback.feedbackByFeature).length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No feedback data available
                </p>
              )}
            </div>
            <div className="flex gap-4 mt-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-gray-600 dark:text-gray-400">Positive</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-400 rounded" />
                <span className="text-gray-600 dark:text-gray-400">Neutral</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span className="text-gray-600 dark:text-gray-400">Negative</span>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Usage Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Daily Usage Trend
          </h3>
          {analytics.usage.requestsByDay.length > 0 ? (
            <div className="h-48 flex items-end gap-1">
              {analytics.usage.requestsByDay.map((day) => {
                const maxCount = Math.max(...analytics.usage.requestsByDay.map((d) => d.count));
                const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                
                return (
                  <div
                    key={day.date}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 transition-colors rounded-t cursor-pointer group relative"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${day.date}: ${day.count} requests`}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                      {day.date}: {day.count}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No daily usage data available
            </p>
          )}
        </div>

        {/* Model Training Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Model Training
            </h3>
            <button
              onClick={handleRetrain}
              disabled={retraining}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              {retraining ? 'Retraining...' : 'Retrain Models'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Cached Models</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {analytics.models.cachedModels}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Last Training</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {analytics.models.lastTrainingTime
                  ? new Date(analytics.models.lastTrainingTime).toLocaleDateString()
                  : 'Never'}
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Needs Retrain</p>
              <p className={`text-lg font-semibold ${trainingStats?.needsRetrain ? 'text-yellow-600' : 'text-green-600'}`}>
                {trainingStats?.needsRetrain ? 'Yes' : 'No'}
              </p>
            </div>
          </div>

          {analytics.models.modelsByType.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Model Details
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">Model Type</th>
                      <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">Last Updated</th>
                      <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">Data Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.models.modelsByType.map((model) => (
                      <tr key={model.modelType} className="border-b border-gray-100 dark:border-gray-700/50">
                        <td className="py-2 px-3 text-gray-900 dark:text-white">{model.modelType}</td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                          {new Date(model.updatedAt).toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                          {(model.dataSize / 1024).toFixed(1)} KB
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Recent Feedback */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Feedback
          </h3>
          {analytics.feedback.recentFeedback.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">Feature</th>
                    <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">Status</th>
                    <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">Rating</th>
                    <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">Comment</th>
                    <th className="text-left py-2 px-3 text-gray-600 dark:text-gray-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.feedback.recentFeedback.map((fb) => (
                    <tr key={fb.id} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="py-2 px-3 text-gray-900 dark:text-white">{fb.featureType}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            fb.accepted
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {fb.accepted ? 'Accepted' : 'Rejected'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                        {fb.rating ? `${fb.rating}/5` : '-'}
                      </td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {fb.feedback || '-'}
                      </td>
                      <td className="py-2 px-3 text-gray-600 dark:text-gray-400">
                        {new Date(fb.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No feedback data available yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
