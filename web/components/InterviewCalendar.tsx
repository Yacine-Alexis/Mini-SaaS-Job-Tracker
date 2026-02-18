"use client";

import { useState, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
  isBefore,
  startOfDay,
} from "date-fns";
import Link from "next/link";
import { InterviewType, InterviewResult } from "@prisma/client";

export type CalendarInterview = {
  id: string;
  scheduledAt: string;
  duration: number | null;
  type: InterviewType;
  location: string | null;
  result: InterviewResult;
  application: {
    id: string;
    company: string;
    title: string;
  };
};

type ViewMode = "month" | "week" | "agenda";

const TYPE_COLORS: Record<InterviewType, string> = {
  PHONE: "bg-blue-500",
  VIDEO: "bg-purple-500",
  ONSITE: "bg-orange-500",
  TECHNICAL: "bg-cyan-500",
  BEHAVIORAL: "bg-pink-500",
  FINAL: "bg-emerald-500",
  OTHER: "bg-zinc-500",
};

const TYPE_LABELS: Record<InterviewType, string> = {
  PHONE: "Phone",
  VIDEO: "Video",
  ONSITE: "On-site",
  TECHNICAL: "Technical",
  BEHAVIORAL: "Behavioral",
  FINAL: "Final",
  OTHER: "Other",
};

const RESULT_STYLES: Record<InterviewResult, { bg: string; text: string }> = {
  PENDING: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
  PASSED: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-400" },
  FAILED: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400" },
  CANCELLED: { bg: "bg-zinc-100 dark:bg-zinc-700", text: "text-zinc-500 dark:text-zinc-400 line-through" },
};

export function InterviewCalendar({
  interviews,
  loading = false,
}: {
  interviews: CalendarInterview[];
  loading?: boolean;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Group interviews by date
  const interviewsByDate = useMemo(() => {
    const map = new Map<string, CalendarInterview[]>();
    for (const interview of interviews) {
      const dateKey = format(parseISO(interview.scheduledAt), "yyyy-MM-dd");
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(interview);
    }
    // Sort each day's interviews by time
    for (const [, dayInterviews] of map) {
      dayInterviews.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    }
    return map;
  }, [interviews]);

  // Generate calendar days for month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Generate week days for week view
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  // Agenda view: upcoming interviews
  const upcomingInterviews = useMemo(() => {
    const today = startOfDay(new Date());
    return interviews
      .filter((i) => !isBefore(parseISO(i.scheduledAt), today) && i.result !== "CANCELLED")
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [interviews]);

  const goToPrevious = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
  };

  const goToNext = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
  };

  const goToToday = () => setCurrentDate(new Date());

  const getInterviewsForDay = (day: Date) => {
    const key = format(day, "yyyy-MM-dd");
    return interviewsByDate.get(key) || [];
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-zinc-200 dark:bg-zinc-700 rounded mb-4" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevious}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
            aria-label="Previous"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
            aria-label="Next"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 ml-2">
            {viewMode === "agenda" ? "Upcoming Interviews" : format(currentDate, viewMode === "month" ? "MMMM yyyy" : "'Week of' MMM d, yyyy")}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
          >
            Today
          </button>
          
          {/* View Mode Tabs */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            {(["month", "week", "agenda"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition ${
                  viewMode === mode
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      {viewMode === "month" && (
        <div className="p-2">
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-zinc-500 dark:text-zinc-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dayInterviews = getInterviewsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(isSameDay(day, selectedDate ?? new Date(0)) ? null : day)}
                  className={`min-h-[100px] p-1 rounded-lg cursor-pointer transition border ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  } ${!isCurrentMonth ? "opacity-40" : ""}`}
                >
                  <div
                    className={`text-sm font-medium mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                      isToday(day) ? "bg-blue-600 text-white" : "text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    {format(day, "d")}
                  </div>

                  {/* Interview Pills */}
                  <div className="space-y-0.5">
                    {dayInterviews.slice(0, 3).map((interview) => (
                      <Link
                        key={interview.id}
                        href={`/applications/${interview.application.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`block text-xs px-1.5 py-0.5 rounded truncate text-white ${TYPE_COLORS[interview.type]} hover:opacity-80 transition`}
                        title={`${interview.application.company} - ${TYPE_LABELS[interview.type]}`}
                      >
                        {format(parseISO(interview.scheduledAt), "HH:mm")} {interview.application.company}
                      </Link>
                    ))}
                    {dayInterviews.length > 3 && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 px-1">
                        +{dayInterviews.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === "week" && (
        <div className="p-2">
          {/* Week View - Time Slots */}
          <div className="grid grid-cols-8 gap-1">
            {/* Time column header */}
            <div className="text-xs text-zinc-500 dark:text-zinc-400 py-2" />
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`text-center py-2 ${isToday(day) ? "bg-blue-50 dark:bg-blue-900/20 rounded-lg" : ""}`}
              >
                <div className="text-xs text-zinc-500 dark:text-zinc-400">{format(day, "EEE")}</div>
                <div className={`text-lg font-semibold ${isToday(day) ? "text-blue-600 dark:text-blue-400" : "text-zinc-700 dark:text-zinc-300"}`}>
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>

          {/* Time slots */}
          <div className="border-t border-zinc-200 dark:border-zinc-700 mt-2 pt-2">
            {Array.from({ length: 12 }, (_, i) => i + 8).map((hour) => (
              <div key={hour} className="grid grid-cols-8 gap-1 min-h-[60px] border-b border-zinc-100 dark:border-zinc-800">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 pr-2 text-right pt-1">
                  {hour.toString().padStart(2, "0")}:00
                </div>
                {weekDays.map((day) => {
                  const dayInterviews = getInterviewsForDay(day);
                  const hourInterviews = dayInterviews.filter((i) => {
                    const interviewHour = new Date(i.scheduledAt).getHours();
                    return interviewHour === hour;
                  });

                  return (
                    <div key={day.toISOString()} className="relative">
                      {hourInterviews.map((interview) => (
                        <Link
                          key={interview.id}
                          href={`/applications/${interview.application.id}`}
                          className={`absolute inset-x-0 mx-0.5 p-1 rounded text-xs text-white ${TYPE_COLORS[interview.type]} hover:opacity-80 transition overflow-hidden`}
                          style={{
                            top: `${(new Date(interview.scheduledAt).getMinutes() / 60) * 100}%`,
                            minHeight: `${Math.max(((interview.duration || 30) / 60) * 100, 30)}%`,
                          }}
                        >
                          <div className="font-medium truncate">{interview.application.company}</div>
                          <div className="opacity-80 truncate">{TYPE_LABELS[interview.type].slice(2)}</div>
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === "agenda" && (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
          {upcomingInterviews.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="font-medium">No upcoming interviews</p>
              <p className="text-sm mt-1">Schedule interviews from your job applications</p>
            </div>
          ) : (
            upcomingInterviews.map((interview) => {
              const date = parseISO(interview.scheduledAt);
              const isPast = isBefore(date, new Date());
              const resultStyle = RESULT_STYLES[interview.result];

              return (
                <Link
                  key={interview.id}
                  href={`/applications/${interview.application.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
                >
                  {/* Date Column */}
                  <div className={`text-center min-w-[60px] ${isPast ? "opacity-60" : ""}`}>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">
                      {format(date, "EEE")}
                    </div>
                    <div className={`text-2xl font-bold ${isToday(date) ? "text-blue-600 dark:text-blue-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                      {format(date, "d")}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {format(date, "MMM")}
                    </div>
                  </div>

                  {/* Time & Type */}
                  <div className={`w-2 h-12 rounded-full ${TYPE_COLORS[interview.type]}`} />

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {interview.application.company}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${resultStyle.bg} ${resultStyle.text}`}>
                        {interview.result}
                      </span>
                    </div>
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                      {interview.application.title}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{format(date, "h:mm a")}</span>
                      {interview.duration && <span>• {interview.duration} min</span>}
                      <span>• {TYPE_LABELS[interview.type]}</span>
                      {interview.location && (
                        <span className="truncate">• {interview.location}</span>
                      )}
                    </div>
                  </div>

                  <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })
          )}
        </div>
      )}

      {/* Selected Day Detail Panel (Month View) */}
      {viewMode === "month" && selectedDate && (
        <div className="border-t border-zinc-200 dark:border-zinc-700 p-4">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </h3>
          {getInterviewsForDay(selectedDate).length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No interviews scheduled</p>
          ) : (
            <div className="space-y-2">
              {getInterviewsForDay(selectedDate).map((interview) => {
                const resultStyle = RESULT_STYLES[interview.result];
                return (
                  <Link
                    key={interview.id}
                    href={`/applications/${interview.application.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
                  >
                    <div className={`w-1 h-10 rounded-full ${TYPE_COLORS[interview.type]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {interview.application.company}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${resultStyle.bg} ${resultStyle.text}`}>
                          {interview.result}
                        </span>
                      </div>
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">{interview.application.title}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {format(parseISO(interview.scheduledAt), "h:mm a")}
                      </div>
                      <div className="text-xs text-zinc-500">{TYPE_LABELS[interview.type]}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
