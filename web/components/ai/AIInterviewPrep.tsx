"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface InterviewQuestion {
  question: string;
  category: 'behavioral' | 'technical' | 'situational' | 'role-specific' | 'company-culture';
  difficulty: 'easy' | 'medium' | 'hard';
  tips?: string;
}

interface AIInterviewPrepProps {
  jobDescription: string;
  jobTitle: string;
  className?: string;
}

export default function AIInterviewPrep({
  jobDescription,
  jobTitle,
  className
}: AIInterviewPrepProps) {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewType, setInterviewType] = useState<'mixed' | 'technical' | 'behavioral'>('mixed');
  const [questionCount, setQuestionCount] = useState(10);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const generateQuestions = useCallback(async () => {
    if (!jobDescription || !jobTitle) {
      setError("Job title and description are required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/interview-questions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jobDescription,
          jobTitle,
          interviewType,
          count: questionCount
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? "Failed to generate questions");
        return;
      }

      setQuestions(data.questions ?? []);
    } catch {
      setError("Failed to generate interview questions");
    } finally {
      setLoading(false);
    }
  }, [jobDescription, jobTitle, interviewType, questionCount]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'behavioral': return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case 'technical': return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case 'situational': return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      case 'role-specific': return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case 'company-culture': return "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400";
      default: return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400";
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'hard': return '🔴';
      default: return '⚪';
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
          <span className="text-lg">🎯</span>
          Interview Prep Questions
        </h3>
        <span className="text-zinc-400">{isExpanded ? "▲" : "▼"}</span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Question Type
              </label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value as 'mixed' | 'technical' | 'behavioral')}
                className="w-full px-2 py-1.5 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="mixed">Mixed (All Types)</option>
                <option value="technical">Technical</option>
                <option value="behavioral">Behavioral</option>
                <option value="situational">Situational</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Number of Questions
              </label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-2 py-1.5 text-sm rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={generateQuestions}
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
                Generating...
              </span>
            ) : questions.length > 0 ? "Generate New Questions" : "Generate Questions"}
          </button>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded">
              {error}
            </div>
          )}

          {/* Questions List */}
          {questions.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {questions.map((q, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedQuestion(expandedQuestion === index ? null : index)}
                    className="w-full p-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getCategoryColor(q.category))}>
                            {q.category}
                          </span>
                          <span className="text-xs" title={`Difficulty: ${q.difficulty}`}>
                            {getDifficultyIcon(q.difficulty)}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-800 dark:text-zinc-200">
                          {q.question}
                        </p>
                      </div>
                      <span className="text-zinc-400 text-xs">
                        {expandedQuestion === index ? "▲" : "▼"}
                      </span>
                    </div>
                  </button>
                  
                  {expandedQuestion === index && q.tips && (
                    <div className="px-3 pb-3 pt-0">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
                        <strong>💡 Tip:</strong> {q.tips}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {questions.length > 0 && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
              🟢 Easy • 🟡 Medium • 🔴 Hard — Click questions to see tips
            </p>
          )}
        </div>
      )}
    </div>
  );
}
