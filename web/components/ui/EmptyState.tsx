"use client";

import { ReactNode } from "react";
import Link from "next/link";

interface EmptyStateProps {
  icon?: "applications" | "notes" | "tasks" | "contacts" | "search" | "links" | "calendar" | "chart" | "document";
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  children?: ReactNode;
}

// SVG illustrations for each type
const illustrations = {
  applications: (
    <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Briefcase illustration */}
      <rect x="40" y="70" width="120" height="90" rx="8" className="fill-zinc-100 dark:fill-zinc-800 stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="2" />
      <rect x="60" y="50" width="80" height="30" rx="4" className="fill-zinc-50 dark:fill-zinc-700 stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="2" />
      <path d="M80 50V40a10 10 0 0 1 10-10h20a10 10 0 0 1 10 10v10" className="stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="2" fill="none" />
      <rect x="90" y="95" width="20" height="20" rx="4" className="fill-blue-500/20 stroke-blue-500" strokeWidth="2" />
      <circle cx="150" cy="140" r="30" className="fill-blue-500/10" />
      <path d="M140 140l6 6 14-14" className="stroke-blue-500" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  notes: (
    <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Notepad illustration */}
      <rect x="50" y="30" width="100" height="140" rx="8" className="fill-amber-50 dark:fill-amber-900/20 stroke-amber-300 dark:stroke-amber-700" strokeWidth="2" />
      <line x1="70" y1="60" x2="130" y2="60" className="stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="2" strokeLinecap="round" />
      <line x1="70" y1="80" x2="130" y2="80" className="stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="2" strokeLinecap="round" />
      <line x1="70" y1="100" x2="110" y2="100" className="stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="2" strokeLinecap="round" />
      <line x1="70" y1="120" x2="120" y2="120" className="stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="2" strokeLinecap="round" />
      {/* Pencil */}
      <rect x="140" y="100" width="12" height="60" rx="2" className="fill-amber-400 stroke-amber-500" strokeWidth="1" transform="rotate(-30 140 100)" />
      <path d="M125 145l5 10 5-3" className="fill-amber-300" />
    </svg>
  ),
  tasks: (
    <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Checklist illustration */}
      <rect x="50" y="40" width="100" height="120" rx="8" className="fill-zinc-100 dark:fill-zinc-800 stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="2" />
      {/* Task 1 - completed */}
      <rect x="65" y="60" width="16" height="16" rx="4" className="fill-green-100 dark:fill-green-900/30 stroke-green-500" strokeWidth="2" />
      <path d="M69 68l3 3 6-6" className="stroke-green-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="90" y1="68" x2="135" y2="68" className="stroke-zinc-300 dark:stroke-zinc-500" strokeWidth="2" strokeLinecap="round" />
      {/* Task 2 - completed */}
      <rect x="65" y="90" width="16" height="16" rx="4" className="fill-green-100 dark:fill-green-900/30 stroke-green-500" strokeWidth="2" />
      <path d="M69 98l3 3 6-6" className="stroke-green-500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="90" y1="98" x2="125" y2="98" className="stroke-zinc-300 dark:stroke-zinc-500" strokeWidth="2" strokeLinecap="round" />
      {/* Task 3 - empty */}
      <rect x="65" y="120" width="16" height="16" rx="4" className="fill-white dark:fill-zinc-700 stroke-zinc-300 dark:stroke-zinc-500" strokeWidth="2" />
      <line x1="90" y1="128" x2="130" y2="128" className="stroke-zinc-200 dark:stroke-zinc-600" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
    </svg>
  ),
  contacts: (
    <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Address book / contacts illustration */}
      <rect x="45" y="40" width="110" height="120" rx="8" className="fill-zinc-100 dark:fill-zinc-800 stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="2" />
      <rect x="45" y="40" width="20" height="120" rx="4" className="fill-blue-500/20 stroke-blue-500/50" strokeWidth="1" />
      {/* Person icon */}
      <circle cx="100" cy="85" r="20" className="fill-blue-100 dark:fill-blue-900/30 stroke-blue-400" strokeWidth="2" />
      <circle cx="100" cy="80" r="8" className="fill-blue-400" />
      <path d="M85 105c0-8 6.7-15 15-15s15 7 15 15" className="stroke-blue-400" strokeWidth="2" fill="none" />
      <line x1="75" y1="125" x2="125" y2="125" className="stroke-zinc-300 dark:stroke-zinc-500" strokeWidth="2" strokeLinecap="round" />
      <line x1="80" y1="140" x2="120" y2="140" className="stroke-zinc-200 dark:stroke-zinc-600" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  search: (
    <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Search / no results illustration */}
      <circle cx="90" cy="85" r="45" className="fill-zinc-100 dark:fill-zinc-800 stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="3" />
      <circle cx="90" cy="85" r="30" className="stroke-zinc-200 dark:stroke-zinc-700" strokeWidth="2" />
      <line x1="125" y1="120" x2="155" y2="150" className="stroke-zinc-400 dark:stroke-zinc-500" strokeWidth="8" strokeLinecap="round" />
      {/* Question mark */}
      <text x="82" y="95" className="fill-zinc-300 dark:fill-zinc-600" fontSize="36" fontWeight="bold">?</text>
    </svg>
  ),
  links: (
    <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Links / attachments illustration */}
      <rect x="50" y="60" width="60" height="80" rx="6" className="fill-zinc-100 dark:fill-zinc-800 stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="2" />
      <rect x="90" y="70" width="60" height="80" rx="6" className="fill-zinc-50 dark:fill-zinc-700 stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="2" />
      {/* Link icon */}
      <path d="M120 100a15 15 0 0 1 0 21.2l-8 8a15 15 0 0 1-21.2-21.2l4-4" className="stroke-blue-500" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M95 125a15 15 0 0 1 0-21.2l8-8a15 15 0 0 1 21.2 21.2l-4 4" className="stroke-blue-500" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  ),
  calendar: (
    <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Calendar illustration */}
      <rect x="40" y="50" width="120" height="110" rx="8" className="fill-zinc-100 dark:fill-zinc-800 stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="2" />
      <rect x="40" y="50" width="120" height="30" rx="8" className="fill-blue-500" />
      <rect x="60" y="35" width="10" height="25" rx="3" className="fill-zinc-400 dark:fill-zinc-500" />
      <rect x="130" y="35" width="10" height="25" rx="3" className="fill-zinc-400 dark:fill-zinc-500" />
      {/* Calendar grid */}
      <g className="fill-zinc-200 dark:fill-zinc-700">
        <rect x="55" y="95" width="20" height="20" rx="4" />
        <rect x="85" y="95" width="20" height="20" rx="4" />
        <rect x="115" y="95" width="20" height="20" rx="4" />
        <rect x="55" y="125" width="20" height="20" rx="4" />
        <rect x="85" y="125" width="20" height="20" rx="4" className="fill-blue-500/30" />
        <rect x="115" y="125" width="20" height="20" rx="4" />
      </g>
    </svg>
  ),
  chart: (
    <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Chart / analytics illustration */}
      <rect x="40" y="40" width="120" height="120" rx="8" className="fill-zinc-100 dark:fill-zinc-800 stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="2" />
      {/* Bars */}
      <rect x="55" y="110" width="20" height="35" rx="4" className="fill-blue-200 dark:fill-blue-900/30" />
      <rect x="85" y="90" width="20" height="55" rx="4" className="fill-blue-300 dark:fill-blue-800/40" />
      <rect x="115" y="70" width="20" height="75" rx="4" className="fill-blue-500" />
      {/* Trend line */}
      <path d="M55 120 L85 105 L125 75" className="stroke-green-500" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="55" cy="120" r="4" className="fill-green-500" />
      <circle cx="85" cy="105" r="4" className="fill-green-500" />
      <circle cx="125" cy="75" r="4" className="fill-green-500" />
    </svg>
  ),
  document: (
    <svg className="w-full h-full" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Document / file illustration */}
      <rect x="50" y="30" width="80" height="100" rx="6" className="fill-zinc-100 dark:fill-zinc-800 stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="2" />
      <path d="M100 30h24a6 6 0 016 6v14a6 6 0 01-6 6h-18a6 6 0 01-6-6V36" className="fill-zinc-50 dark:fill-zinc-700 stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="2" />
      <path d="M100 30v20a6 6 0 006 6h24" className="stroke-zinc-300 dark:stroke-zinc-600" strokeWidth="2" fill="none" />
      {/* Document lines */}
      <line x1="65" y1="70" x2="115" y2="70" className="stroke-zinc-300 dark:stroke-zinc-500" strokeWidth="2" strokeLinecap="round" />
      <line x1="65" y1="85" x2="105" y2="85" className="stroke-zinc-300 dark:stroke-zinc-500" strokeWidth="2" strokeLinecap="round" />
      <line x1="65" y1="100" x2="110" y2="100" className="stroke-zinc-300 dark:stroke-zinc-500" strokeWidth="2" strokeLinecap="round" />
      {/* Second document behind */}
      <rect x="70" y="50" width="80" height="100" rx="6" className="fill-blue-50 dark:fill-blue-900/20 stroke-blue-300 dark:stroke-blue-700" strokeWidth="2" />
      <line x1="85" y1="80" x2="135" y2="80" className="stroke-blue-300 dark:stroke-blue-600" strokeWidth="2" strokeLinecap="round" />
      <line x1="85" y1="95" x2="125" y2="95" className="stroke-blue-300 dark:stroke-blue-600" strokeWidth="2" strokeLinecap="round" />
      <line x1="85" y1="110" x2="130" y2="110" className="stroke-blue-300 dark:stroke-blue-600" strokeWidth="2" strokeLinecap="round" />
      {/* Plus icon */}
      <circle cx="140" cy="140" r="25" className="fill-blue-500/10 stroke-blue-500" strokeWidth="2" />
      <path d="M140 130v20M130 140h20" className="stroke-blue-500" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
};

export default function EmptyState({
  icon = "applications",
  title,
  description,
  action,
  secondaryAction,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Illustration */}
      <div className="w-48 h-48 mb-6 opacity-80">
        {illustrations[icon]}
      </div>

      {/* Text */}
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">{description}</p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action && (
            action.href ? (
              <Link
                href={action.href}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {action.label}
              </Link>
            ) : (
              <button
                onClick={action.onClick}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {action.label}
              </button>
            )
          )}
          {secondaryAction && (
            secondaryAction.href ? (
              <Link
                href={secondaryAction.href}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                onClick={secondaryAction.onClick}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
              >
                {secondaryAction.label}
              </button>
            )
          )}
        </div>
      )}

      {/* Custom content */}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

// Compact variant for inline empty states (like panels)
interface CompactEmptyStateProps {
  icon?: keyof typeof illustrations;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function CompactEmptyState({ icon, title, description, action }: CompactEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      {icon && (
        <div className="w-24 h-24 mb-4 opacity-60">
          {illustrations[icon]}
        </div>
      )}
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {action.label}
        </button>
      )}
    </div>
  );
}
