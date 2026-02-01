"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";

type TimelineEvent = {
  id: string;
  type: "audit" | "note" | "task" | "interview" | "contact" | "created";
  title: string;
  description?: string;
  date: string;
  icon: string;
  color: string;
  meta?: Record<string, unknown>;
};

interface TimelinePanelProps {
  applicationId: string;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  plus: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  trash: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  note: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  task: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  calendar: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  user: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  green: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-600 dark:text-green-400",
    border: "border-green-500",
  },
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500",
  },
  red: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-500",
  },
  yellow: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-600 dark:text-yellow-400",
    border: "border-yellow-500",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-500",
  },
  indigo: {
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-500",
  },
  teal: {
    bg: "bg-teal-100 dark:bg-teal-900/30",
    text: "text-teal-600 dark:text-teal-400",
    border: "border-teal-500",
  },
};

export default function TimelinePanel({ applicationId }: TimelinePanelProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/timeline`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error?.message ?? "Failed to load timeline");
        return;
      }
      setEvents(data.events ?? []);
    } catch {
      setErr("Failed to load timeline");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void load();
  }, [load]);

  const displayEvents = expanded ? events : events.slice(0, 5);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Activity Timeline
        </h2>
        <button onClick={() => load()} className="btn btn-sm text-xs" disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {err && (
        <div className="text-sm text-red-600 dark:text-red-400 mb-4">{err}</div>
      )}

      {!loading && events.length === 0 && (
        <div className="text-center py-6 text-zinc-500 dark:text-zinc-400">
          <svg className="mx-auto h-10 w-10 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2 text-sm">No activity recorded yet</p>
        </div>
      )}

      {(loading || events.length > 0) && (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-200 dark:bg-zinc-700" />

          <div className="space-y-4">
            {loading
              ? [...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="relative z-10 w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 shrink-0" />
                    <div className="flex-1 py-1">
                      <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2" />
                    </div>
                  </div>
                ))
              : displayEvents.map((event) => {
                  const colors = COLOR_MAP[event.color] ?? COLOR_MAP.blue;
                  return (
                    <div key={event.id} className="flex gap-4">
                      {/* Icon circle */}
                      <div
                        className={`relative z-10 w-8 h-8 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center shrink-0 border-2 ${colors.border}`}
                      >
                        {ICON_MAP[event.icon] ?? ICON_MAP.info}
                      </div>

                      {/* Content */}
                      <div className="flex-1 py-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100 text-sm">
                            {event.title}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {formatDistanceToNow(new Date(event.date), { addSuffix: true })}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      )}

      {events.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline w-full text-center"
        >
          {expanded ? "Show less" : `Show ${events.length - 5} more events`}
        </button>
      )}
    </div>
  );
}
