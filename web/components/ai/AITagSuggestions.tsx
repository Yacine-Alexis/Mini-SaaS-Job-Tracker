"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

type TagSuggestion = {
  tag: string;
  confidence: number;
  source: string;
};

interface AITagSuggestionsProps {
  jobDescription: string;
  jobTitle: string;
  company?: string;
  onTagSelect?: (tag: string) => void;
  selectedTags?: string[];
  className?: string;
}

export default function AITagSuggestions({
  jobDescription,
  jobTitle,
  company,
  onTagSelect,
  selectedTags = [],
  className
}: AITagSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateSuggestions = useCallback(async () => {
    if (!jobDescription || !jobTitle) {
      setError("Job title and description are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/tags", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobDescription, jobTitle, company })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "Failed to generate suggestions");
        return;
      }

      setSuggestions(data.suggestions ?? []);
      setHasGenerated(true);
    } catch {
      setError("Failed to generate tag suggestions");
    } finally {
      setLoading(false);
    }
  }, [jobDescription, jobTitle, company]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (confidence >= 0.4) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400";
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'skills': return '💻';
      case 'industry': return '🏢';
      case 'role': return '👤';
      case 'keywords': return '🔑';
      case 'learned': return '🤖';
      default: return '📌';
    }
  };

  return (
    <div className={cn("rounded-lg border border-zinc-200 dark:border-zinc-700 p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
          <span className="text-lg">🤖</span>
          AI Tag Suggestions
        </h3>
        <button
          type="button"
          onClick={generateSuggestions}
          disabled={loading || !jobDescription || !jobTitle}
          className={cn(
            "text-xs px-3 py-1.5 rounded-md font-medium transition-colors",
            loading
              ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          )}
        >
          {loading ? (
            <span className="flex items-center gap-1">
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing...
            </span>
          ) : hasGenerated ? "Regenerate" : "Generate Tags"}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded">
          {error}
        </div>
      )}

      {!hasGenerated && !loading && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Click &quot;Generate Tags&quot; to get AI-powered tag suggestions based on the job description.
        </p>
      )}

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => {
              const isSelected = selectedTags.includes(suggestion.tag);
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => onTagSelect?.(suggestion.tag)}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                    isSelected
                      ? "bg-blue-600 text-white ring-2 ring-blue-300"
                      : getConfidenceColor(suggestion.confidence),
                    "hover:ring-2 hover:ring-blue-400 cursor-pointer"
                  )}
                  title={`Source: ${suggestion.source} | Confidence: ${Math.round(suggestion.confidence * 100)}%`}
                >
                  <span>{getSourceIcon(suggestion.source)}</span>
                  <span>{suggestion.tag}</span>
                  {isSelected && <span>✓</span>}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
            Click tags to add them. 🤖 AI-generated • 💻 Skills • 🏢 Industry • 👤 Role
          </p>
        </div>
      )}
    </div>
  );
}
