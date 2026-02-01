"use client";

import Link from "next/link";
import { ApplicationStage } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";

interface TimelineEvent {
  id: string;
  type: "application" | "stage_change" | "note" | "task" | "interview";
  title: string;
  subtitle?: string;
  applicationId: string;
  company: string;
  stage?: ApplicationStage;
  date: string;
  metadata?: Record<string, unknown>;
}

interface ApplicationTimelineProps {
  events: TimelineEvent[];
  maxItems?: number;
  showViewAll?: boolean;
}

const eventConfig: Record<TimelineEvent["type"], { icon: React.ReactNode; color: string }> = {
  application: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    color: "bg-blue-500 text-white",
  },
  stage_change: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    color: "bg-purple-500 text-white",
  },
  note: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    color: "bg-amber-500 text-white",
  },
  task: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    color: "bg-green-500 text-white",
  },
  interview: {
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: "bg-indigo-500 text-white",
  },
};

const stageColors: Record<ApplicationStage, string> = {
  SAVED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300",
  APPLIED: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  INTERVIEW: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  OFFER: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
};

export function ApplicationTimeline({ events, maxItems = 10, showViewAll = true }: ApplicationTimelineProps) {
  const displayEvents = maxItems ? events.slice(0, maxItems) : events;
  const hasMore = events.length > displayEvents.length;

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
        <svg className="mx-auto h-10 w-10 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm">No recent activity</p>
        <p className="text-xs mt-1">Your job search timeline will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-zinc-200 dark:bg-zinc-700" />

        {/* Events */}
        <div className="space-y-4">
          {displayEvents.map((event, index) => {
            const config = eventConfig[event.type];
            const isLast = index === displayEvents.length - 1;

            return (
              <div key={event.id} className="relative flex gap-4">
                {/* Icon */}
                <div className={`
                  relative z-10 flex h-8 w-8 items-center justify-center rounded-full
                  ${config.color}
                  ring-4 ring-white dark:ring-zinc-900
                `}>
                  {config.icon}
                </div>

                {/* Content */}
                <div className={`flex-1 pb-4 ${!isLast ? "border-b border-zinc-100 dark:border-zinc-800" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link 
                        href={`/applications/${event.applicationId}`}
                        className="font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {event.title}
                      </Link>
                      {event.subtitle && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {event.subtitle}
                        </p>
                      )}
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                        {event.company}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {event.stage && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageColors[event.stage]}`}>
                          {event.stage.charAt(0) + event.stage.slice(1).toLowerCase()}
                        </span>
                      )}
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                        {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {hasMore && showViewAll && (
        <div className="text-center pt-2">
          <Link 
            href="/applications"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View all activity →
          </Link>
        </div>
      )}
    </div>
  );
}

// Compact timeline for cards
export function CompactTimeline({ events, maxItems = 5 }: { events: TimelineEvent[]; maxItems?: number }) {
  const displayEvents = events.slice(0, maxItems);

  return (
    <div className="space-y-2">
      {displayEvents.map((event) => (
        <Link
          key={event.id}
          href={`/applications/${event.applicationId}`}
          className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
            {event.company.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {event.title}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {event.company} • {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
            </p>
          </div>
          {event.stage && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${stageColors[event.stage]}`}>
              {event.stage.charAt(0) + event.stage.slice(1).toLowerCase()}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
