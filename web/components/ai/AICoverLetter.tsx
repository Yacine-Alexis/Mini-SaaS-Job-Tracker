"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface GeneratedCoverLetter {
  content: string;
  keyPhrases: string[];
  customizationTips: string[];
  tokensUsed: number;
}

interface AICoverLetterProps {
  jobDescription: string;
  jobTitle: string;
  companyName: string;
  className?: string;
}

export default function AICoverLetter({
  jobDescription,
  jobTitle,
  companyName,
  className
}: AICoverLetterProps) {
  const [resume, setResume] = useState("");
  const [result, setResult] = useState<GeneratedCoverLetter | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tone, setTone] = useState<'professional' | 'conversational' | 'enthusiastic'>('professional');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const generateLetter = useCallback(async () => {
    if (!jobDescription || !jobTitle || !companyName || !resume) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/cover-letter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          jobTitle,
          companyName,
          resume,
          tone,
          length
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "Failed to generate cover letter");
        return;
      }

      setResult(data.coverLetter);
    } catch {
      setError("Failed to generate cover letter");
    } finally {
      setLoading(false);
    }
  }, [jobDescription, jobTitle, companyName, resume, tone, length]);

  const copyToClipboard = async () => {
    if (result?.content) {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={cn("rounded-lg border border-zinc-200 dark:border-zinc-700 p-4", className)}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
          <span className="text-lg">✉️</span>
          AI Cover Letter Generator
        </h3>
        <span className="text-zinc-400">{isExpanded ? "▲" : "▼"}</span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Resume Input */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Paste your resume
            </label>
            <textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your resume text here..."
              className="w-full h-24 px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Tone
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as typeof tone)}
                className="w-full px-2 py-1.5 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="professional">Professional</option>
                <option value="conversational">Conversational</option>
                <option value="enthusiastic">Enthusiastic</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Length
              </label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value as typeof length)}
                className="w-full px-2 py-1.5 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={generateLetter}
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
                Generating...
              </span>
            ) : "Generate Cover Letter"}
          </button>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              {/* Cover Letter Content */}
              <div className="relative">
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="absolute top-2 right-2 px-2 py-1 text-xs bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                >
                  {copied ? "✓ Copied!" : "📋 Copy"}
                </button>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 max-h-80 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300 font-sans">
                    {result.content}
                  </pre>
                </div>
              </div>

              {/* Key Phrases */}
              {result.keyPhrases.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase mb-2">
                    Key Phrases Used
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.keyPhrases.map((phrase, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full"
                      >
                        {phrase}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Customization Tips */}
              {result.customizationTips.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase mb-2">
                    💡 Customization Tips
                  </h4>
                  <ul className="space-y-1.5">
                    {result.customizationTips.map((tip, i) => (
                      <li
                        key={i}
                        className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-2"
                      >
                        <span className="text-amber-500 mt-0.5">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
                ⚠️ Review and personalize before sending. Replace [placeholders] with your information.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
