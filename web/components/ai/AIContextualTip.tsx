'use client';

/**
 * AIContextualTip - Shows smart, contextual tips based on application stage.
 * Non-intrusive, appears as a small banner with helpful advice.
 */

import { useState, useEffect } from 'react';
import { CloseIcon, LightbulbIcon } from '@/components/icons';
import { ApplicationStage } from '@prisma/client';

interface AIContextualTipProps {
  stage: ApplicationStage;
  company: string;
  appliedDate?: string | null;
  hasInterviews?: boolean;
  hasTasks?: boolean;
}

// Stage-specific tips with actionable advice
const STAGE_TIPS: Record<ApplicationStage, string[]> = {
  SAVED: [
    "Review the job description and tailor your resume before applying.",
    "Research the company on LinkedIn and Glassdoor to understand their culture.",
    "Prepare a customized cover letter highlighting relevant experience.",
    "Check if you have any connections at this company for a referral.",
  ],
  APPLIED: [
    "Set a reminder to follow up in 1-2 weeks if you haven't heard back.",
    "Connect with the recruiter on LinkedIn with a personalized message.",
    "Continue applying to other positions while waiting for a response.",
    "Track when you applied to calculate response time patterns.",
  ],
  INTERVIEW: [
    "Research your interviewers on LinkedIn before the meeting.",
    "Prepare 3-5 questions to ask about the role and team.",
    "Practice common behavioral questions using the STAR method.",
    "Send a thank-you email within 24 hours after the interview.",
    "Take notes on key discussion points for future reference.",
  ],
  OFFER: [
    "Congratulations! Take time to evaluate the complete compensation package.",
    "Research market rates to ensure the offer is competitive.",
    "Consider negotiating - most companies expect some back-and-forth.",
    "Ask about benefits, equity, growth opportunities, and work flexibility.",
    "Get the offer details in writing before making a decision.",
  ],
  REJECTED: [
    "Request feedback to understand areas for improvement.",
    "Don't take it personally - many factors affect hiring decisions.",
    "Review what went well and what could be improved for next time.",
    "Keep the door open - you can reapply in the future.",
    "Use this as learning for your next applications.",
  ],
};

// Calculate days since applied
function daysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

// Generate contextual tips based on the application state
function getContextualTips(props: AIContextualTipProps): string[] {
  const tips: string[] = [];
  const stageTips = STAGE_TIPS[props.stage];
  
  // Add a random stage-specific tip
  tips.push(stageTips[Math.floor(Math.random() * stageTips.length)]);

  // Add time-based tips
  if (props.appliedDate) {
    const days = daysSince(props.appliedDate);
    
    if (props.stage === 'APPLIED' && days >= 14 && days < 21) {
      tips.unshift(`It's been ${days} days since you applied. Consider sending a follow-up email.`);
    } else if (props.stage === 'APPLIED' && days >= 21) {
      tips.unshift(`${days} days without response. The position may be filled, but a polite follow-up can't hurt.`);
    } else if (props.stage === 'INTERVIEW' && days >= 7) {
      tips.unshift(`Interview was ${days} days ago. If you haven't heard back, it's okay to follow up.`);
    }
  }

  // Add task-based tips
  if (props.stage === 'INTERVIEW' && !props.hasTasks) {
    tips.push("Create tasks for interview prep: research company, practice questions, prepare outfit.");
  }

  return tips.slice(0, 2); // Return max 2 tips
}

export default function AIContextualTip(props: AIContextualTipProps) {
  const [tips, setTips] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    const generatedTips = getContextualTips(props);
    setTips(generatedTips);
  }, [props.stage, props.company, props.appliedDate, props.hasInterviews, props.hasTasks]);

  if (dismissed || tips.length === 0) return null;

  return (
    <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 mb-4 animate-fade-in">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        aria-label="Dismiss tip"
      >
        <CloseIcon className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
          <LightbulbIcon className="w-4 h-4 text-blue-600 dark:text-blue-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">AI Tip</span>
            {tips.length > 1 && (
              <span className="text-xs text-zinc-500">
                {currentTip + 1}/{tips.length}
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {tips[currentTip]}
          </p>
          {tips.length > 1 && (
            <button
              onClick={() => setCurrentTip((prev) => (prev + 1) % tips.length)}
              className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Next tip →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
