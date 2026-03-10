"use client";

import { useState } from "react";
import AITagSuggestions from "./AITagSuggestions";
import AIResumeMatch from "./AIResumeMatch";
import AIInterviewPrep from "./AIInterviewPrep";
import AICoverLetter from "./AICoverLetter";
import AISalaryEstimate from "./AISalaryEstimate";
import { cn } from "@/lib/utils";

interface AIToolsPanelProps {
  jobDescription: string;
  jobTitle: string;
  company: string;
  location?: string;
  onTagSelect?: (tag: string) => void;
  selectedTags?: string[];
  className?: string;
}

type AITool = 'tags' | 'resume' | 'interview' | 'cover-letter' | 'salary';

export default function AIToolsPanel({
  jobDescription,
  jobTitle,
  company,
  location,
  onTagSelect,
  selectedTags = [],
  className
}: AIToolsPanelProps) {
  const [activeTool, setActiveTool] = useState<AITool | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tools: { id: AITool; label: string; icon: string; description: string }[] = [
    { id: 'tags', label: 'Tag Suggestions', icon: '🏷️', description: 'AI-powered tag suggestions' },
    { id: 'resume', label: 'Resume Match', icon: '📊', description: 'Analyze resume compatibility' },
    { id: 'interview', label: 'Interview Prep', icon: '🎯', description: 'Generate practice questions' },
    { id: 'cover-letter', label: 'Cover Letter', icon: '✉️', description: 'Generate cover letter' },
    { id: 'salary', label: 'Salary Estimate', icon: '💰', description: 'Estimate salary range' },
  ];

  if (!jobDescription) {
    return (
      <div className={cn("rounded-lg border border-zinc-200 dark:border-zinc-700 p-4", className)}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">🤖</span>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">AI Tools</h3>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Add a job description to unlock AI-powered tools.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden", className)}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">AI Assistant</h3>
          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-full">
            Local AI
          </span>
        </div>
        <span className="text-zinc-400">{isCollapsed ? "▼" : "▲"}</span>
      </button>

      {!isCollapsed && (
        <div className="p-4 space-y-4">
          {/* Tool Selector */}
          <div className="flex flex-wrap gap-2">
            {tools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  activeTool === tool.id
                    ? "bg-blue-600 text-white shadow-lg scale-105"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                )}
                title={tool.description}
              >
                <span>{tool.icon}</span>
                <span>{tool.label}</span>
              </button>
            ))}
          </div>

          {/* Tool Content */}
          <div className="min-h-0">
            {activeTool === 'tags' && (
              <AITagSuggestions
                jobDescription={jobDescription}
                jobTitle={jobTitle}
                company={company}
                onTagSelect={onTagSelect}
                selectedTags={selectedTags}
                className="border-0 p-0"
              />
            )}

            {activeTool === 'resume' && (
              <AIResumeMatch
                jobDescription={jobDescription}
                jobTitle={jobTitle}
                className="border-0 p-0"
              />
            )}

            {activeTool === 'interview' && (
              <AIInterviewPrep
                jobDescription={jobDescription}
                jobTitle={jobTitle}
                className="border-0 p-0"
              />
            )}

            {activeTool === 'cover-letter' && (
              <AICoverLetter
                jobDescription={jobDescription}
                jobTitle={jobTitle}
                companyName={company}
                className="border-0 p-0"
              />
            )}

            {activeTool === 'salary' && (
              <AISalaryEstimate
                jobDescription={jobDescription}
                jobTitle={jobTitle}
                location={location}
                className="border-0 p-0"
              />
            )}

            {!activeTool && (
              <div className="text-center py-6 text-zinc-500 dark:text-zinc-400">
                <p className="text-sm">Select a tool to get started</p>
                <p className="text-xs mt-1">All AI processing happens locally - no data sent to external servers</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
