'use client';

/**
 * AISmartSummary - Compact AI-powered summary shown on dashboard.
 * Shows key metrics and actionable insights in a small footprint.
 */

import { useState, useEffect } from 'react';
import { SparklesIcon } from '@/components/icons';

interface SmartSummaryData {
  insights: string[];
}

export default function AISmartSummary() {
  const [data, setData] = useState<SmartSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai/assistant')
      .then(res => res.json())
      .then(d => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 animate-pulse">
        <SparklesIcon className="w-4 h-4" />
        <span>Analyzing...</span>
      </div>
    );
  }

  if (!data?.insights?.length) return null;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-100 dark:border-blue-800/30">
      <div className="flex-shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <SparklesIcon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">AI Insights</p>
        <ul className="space-y-1">
          {data.insights.slice(0, 3).map((insight, i) => (
            <li key={i} className="text-sm text-zinc-700 dark:text-zinc-300 flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
