"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface SalaryEstimate {
  min: number;
  max: number;
  median: number;
  confidence: number;
  factors: string[];
  dataSources: string[];
}

interface AISalaryEstimateProps {
  jobDescription: string;
  jobTitle: string;
  location?: string;
  className?: string;
}

export default function AISalaryEstimate({
  jobDescription,
  jobTitle,
  location,
  className
}: AISalaryEstimateProps) {
  const [estimate, setEstimate] = useState<SalaryEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [experienceYears, setExperienceYears] = useState<number | undefined>(undefined);
  const [isExpanded, setIsExpanded] = useState(false);

  const getEstimate = useCallback(async () => {
    if (!jobDescription || !jobTitle) {
      setError("Job title and description are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/salary-estimate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jobTitle,
          jobDescription,
          location,
          experienceYears
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "Failed to estimate salary");
        return;
      }

      setEstimate(data.estimate);
    } catch {
      setError("Failed to estimate salary");
    } finally {
      setLoading(false);
    }
  }, [jobDescription, jobTitle, location, experienceYears]);

  const formatSalary = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.7) return { label: 'High', color: 'text-green-600 dark:text-green-400' };
    if (confidence >= 0.5) return { label: 'Medium', color: 'text-yellow-600 dark:text-yellow-400' };
    return { label: 'Low', color: 'text-red-600 dark:text-red-400' };
  };

  return (
    <div className={cn("rounded-lg border border-zinc-200 dark:border-zinc-700 p-4", className)}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
          <span className="text-lg">💰</span>
          Salary Estimation
        </h3>
        <span className="text-zinc-400">{isExpanded ? "▲" : "▼"}</span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Experience Input */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Years of Experience (optional)
            </label>
            <input
              type="number"
              min={0}
              max={50}
              value={experienceYears ?? ''}
              onChange={(e) => setExperienceYears(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g., 5"
              className="w-full px-3 py-1.5 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <button
            type="button"
            onClick={getEstimate}
            disabled={loading || !jobDescription || !jobTitle}
            className={cn(
              "w-full py-2 px-4 rounded-md text-sm font-medium transition-colors",
              loading || !jobDescription || !jobTitle
                ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Estimating...
              </span>
            ) : estimate ? "Recalculate" : "Estimate Salary"}
          </button>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded">
              {error}
            </div>
          )}

          {/* Result */}
          {estimate && (
            <div className="space-y-4">
              {/* Main estimate */}
              <div className="text-center p-4 bg-gradient-to-b from-green-50 to-transparent dark:from-green-900/20 rounded-lg">
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Estimated Range</p>
                <div className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">
                  {formatSalary(estimate.min)} - {formatSalary(estimate.max)}
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Median: <span className="font-semibold">{formatSalary(estimate.median)}</span>
                </p>
              </div>

              {/* Visual range */}
              <div className="px-2">
                <div className="relative h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="absolute h-full bg-gradient-to-r from-green-400 to-green-600"
                    style={{
                      left: '10%',
                      right: '10%',
                      width: '80%'
                    }}
                  />
                  <div
                    className="absolute h-full w-1 bg-green-800"
                    style={{ left: '50%', transform: 'translateX(-50%)' }}
                    title="Median"
                  />
                </div>
                <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  <span>{formatSalary(estimate.min)}</span>
                  <span>{formatSalary(estimate.max)}</span>
                </div>
              </div>

              {/* Confidence */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Confidence:</span>
                <span className={cn("font-medium", getConfidenceLabel(estimate.confidence).color)}>
                  {getConfidenceLabel(estimate.confidence).label} ({Math.round(estimate.confidence * 100)}%)
                </span>
              </div>

              {/* Factors */}
              {estimate.factors.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase mb-2">
                    Factors Considered
                  </h4>
                  <ul className="space-y-1">
                    {estimate.factors.map((factor, i) => (
                      <li key={i} className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                ⚠️ Estimate based on industry averages. Actual salaries may vary.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
