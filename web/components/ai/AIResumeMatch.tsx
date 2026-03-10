"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface MatchResult {
  score: number;
  breakdown: {
    skills: number;
    experience: number;
    keywords: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
}

interface AIResumeMatchProps {
  jobDescription: string;
  jobTitle?: string;
  className?: string;
}

export default function AIResumeMatch({
  jobDescription,
  jobTitle,
  className
}: AIResumeMatchProps) {
  const [resume, setResume] = useState("");
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const analyzeMatch = useCallback(async () => {
    if (!jobDescription || !resume) {
      setError("Both job description and resume are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/resume-match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobDescription, resume, jobTitle })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "Failed to analyze match");
        return;
      }

      setResult(data.match);
    } catch {
      setError("Failed to analyze resume match");
    } finally {
      setLoading(false);
    }
  }, [jobDescription, resume, jobTitle]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className={cn("rounded-lg border border-zinc-200 dark:border-zinc-700 p-4", className)}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
          <span className="text-lg">📊</span>
          Resume Match Analysis
        </h3>
        <span className="text-zinc-400">{isExpanded ? "▲" : "▼"}</span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Paste your resume
            </label>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your resume text here to analyze how well it matches this job..."
              className="w-full h-32 px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="button"
            onClick={analyzeMatch}
            disabled={loading || !resume.trim()}
            className={cn(
              "w-full py-2 px-4 rounded-md text-sm font-medium transition-colors",
              loading || !resume.trim()
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
                Analyzing...
              </span>
            ) : "Analyze Match"}
          </button>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Overall Score */}
              <div className="text-center">
                <div className={cn("text-4xl font-bold", getScoreColor(result.score))}>
                  {result.score}%
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Match Score</p>
              </div>

              {/* Score Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase">Breakdown</h4>
                
                {Object.entries(result.breakdown).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-600 dark:text-zinc-400 capitalize">{key}</span>
                      <span className={cn("font-medium", getScoreColor(value))}>{value}%</span>
                    </div>
                    <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full transition-all duration-500", getScoreBgColor(value))}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Matched Skills */}
              {result.matchedSkills.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase mb-2">
                    ✅ Matched Skills ({result.matchedSkills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedSkills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Skills */}
              {result.missingSkills.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase mb-2">
                    ❌ Missing Skills ({result.missingSkills.length})
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingSkills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {result.suggestions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase mb-2">
                    💡 Suggestions
                  </h4>
                  <ul className="space-y-1.5">
                    {result.suggestions.map((suggestion, i) => (
                      <li
                        key={i}
                        className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2"
                      >
                        <span className="text-blue-500 mt-0.5">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
