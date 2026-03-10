"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ApplicationInsights {
  stageConversionRates: Record<string, number>;
  averageTimeInStage: Record<string, number>;
  bestPractices: string[];
  improvements: string[];
  predictions: Array<{
    applicationId: string;
    company: string;
    successProbability: number;
    factors: string[];
  }>;
}

interface AIInsightsCardProps {
  className?: string;
}

export default function AIInsightsCard({ className }: AIInsightsCardProps) {
  const [insights, setInsights] = useState<ApplicationInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicationCount, setApplicationCount] = useState(0);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/insights", { cache: "no-store" });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data?.error?.message ?? "Failed to load insights");
        return;
      }

      setInsights(data.insights);
      setApplicationCount(data.meta?.applicationCount ?? 0);
    } catch {
      setError("Failed to load AI insights");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const getStageColor = (stage: string) => {
    switch (stage.toUpperCase()) {
      case 'SAVED': return 'bg-zinc-500';
      case 'APPLIED': return 'bg-blue-500';
      case 'INTERVIEW': return 'bg-yellow-500';
      case 'OFFER': return 'bg-green-500';
      case 'REJECTED': return 'bg-red-500';
      default: return 'bg-zinc-400';
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.6) return "text-green-600 dark:text-green-400";
    if (probability >= 0.4) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (loading) {
    return (
      <div className={cn("rounded-lg border border-zinc-200 dark:border-zinc-700 p-6", className)}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🤖</span>
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">AI Insights</h3>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-1/2" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("rounded-lg border border-red-200 dark:border-red-800 p-6 bg-red-50 dark:bg-red-900/20", className)}>
        <div className="flex items-center gap-2">
          <span className="text-xl">⚠️</span>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
        <button
          onClick={fetchInsights}
          className="mt-2 text-xs text-red-600 dark:text-red-400 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className={cn("rounded-lg border border-zinc-200 dark:border-zinc-700 p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">AI Insights</h3>
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Analyzing {applicationCount} applications
        </span>
      </div>

      {applicationCount < 5 && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-700 dark:text-amber-400">
          💡 Add more applications for better AI insights!
        </div>
      )}

      {/* Stage Conversion Funnel */}
      {Object.keys(insights.stageConversionRates).length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase mb-3">
            Application Pipeline
          </h4>
          <div className="space-y-2">
            {Object.entries(insights.stageConversionRates)
              .sort((a, b) => {
                const order = ['SAVED', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'];
                return order.indexOf(a[0]) - order.indexOf(b[0]);
              })
              .map(([stage, percentage]) => (
                <div key={stage} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-zinc-600 dark:text-zinc-400 capitalize">
                    {stage.toLowerCase()}
                  </div>
                  <div className="flex-1 h-4 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-500", getStageColor(stage))}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-12 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    {percentage}%
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Best Practices */}
      {insights.bestPractices.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase mb-2 flex items-center gap-1">
            <span>✅</span> What&apos;s Working
          </h4>
          <ul className="space-y-1">
            {insights.bestPractices.map((practice, i) => (
              <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                {practice}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {insights.improvements.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase mb-2 flex items-center gap-1">
            <span>💡</span> Suggestions
          </h4>
          <ul className="space-y-1">
            {insights.improvements.map((improvement, i) => (
              <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5">•</span>
                {improvement}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Predictions */}
      {insights.predictions.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase mb-2 flex items-center gap-1">
            <span>🔮</span> Success Predictions
          </h4>
          <div className="space-y-2">
            {insights.predictions.map((pred) => (
              <div
                key={pred.applicationId}
                className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
              >
                <div>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {pred.company}
                  </span>
                  {pred.factors.length > 0 && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {pred.factors[0]}
                    </p>
                  )}
                </div>
                <div className={cn("text-lg font-bold", getProbabilityColor(pred.successProbability))}>
                  {Math.round(pred.successProbability * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <button
          onClick={fetchInsights}
          className="w-full text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          ↻ Refresh Insights
        </button>
      </div>
    </div>
  );
}
