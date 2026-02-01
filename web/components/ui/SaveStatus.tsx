"use client";

import { formatDistanceToNow } from "date-fns";

interface SaveStatusIndicatorProps {
  status: "idle" | "saving" | "saved" | "error" | "draft";
  lastSaved?: Date | null;
  error?: string | null;
  className?: string;
}

export function SaveStatusIndicator({
  status,
  lastSaved,
  error,
  className = "",
}: SaveStatusIndicatorProps) {
  const statusConfig = {
    idle: {
      icon: null,
      text: lastSaved ? `Saved ${formatDistanceToNow(lastSaved, { addSuffix: true })}` : "",
      color: "text-zinc-400 dark:text-zinc-500",
    },
    saving: {
      icon: (
        <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ),
      text: "Saving...",
      color: "text-blue-500 dark:text-blue-400",
    },
    saved: {
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      text: "Saved",
      color: "text-green-500 dark:text-green-400",
    },
    error: {
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      text: error || "Save failed",
      color: "text-red-500 dark:text-red-400",
    },
    draft: {
      icon: (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      text: "Unsaved changes",
      color: "text-amber-500 dark:text-amber-400",
    },
  };

  const config = statusConfig[status];

  if (status === "idle" && !lastSaved) return null;

  return (
    <div className={`flex items-center gap-1.5 text-xs ${config.color} ${className}`}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}

// Inline badge version
export function SaveStatusBadge({ status }: { status: SaveStatusIndicatorProps["status"] }) {
  const badges = {
    idle: null,
    saving: (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
        <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Saving
      </span>
    ),
    saved: (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Saved
      </span>
    ),
    error: (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Error
      </span>
    ),
    draft: (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
        Draft
      </span>
    ),
  };

  return badges[status];
}

// Draft restore banner
interface DraftBannerProps {
  onRestore: () => void;
  onDiscard: () => void;
}

export function DraftBanner({ onRestore, onDiscard }: DraftBannerProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center">
          <svg className="h-4 w-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Unsaved draft found
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Would you like to restore your previous changes?
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onDiscard}
          className="px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-800/50 rounded-lg transition-colors"
        >
          Discard
        </button>
        <button
          onClick={onRestore}
          className="px-3 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
        >
          Restore
        </button>
      </div>
    </div>
  );
}
