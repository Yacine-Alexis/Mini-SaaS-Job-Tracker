import { requireUserOr401 } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { InterviewCalendar, CalendarInterview } from "@/components/InterviewCalendar";
import Link from "next/link";

export default async function CalendarPage() {
  const { userId, error } = await requireUserOr401();
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Sign in to view your calendar
          </h2>
          <Link href="/login" className="text-blue-600 hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  // Fetch all interviews with application details
  const interviews = await prisma.interview.findMany({
    where: {
      userId,
      deletedAt: null,
      application: {
        deletedAt: null,
      },
    },
    include: {
      application: {
        select: {
          id: true,
          company: true,
          title: true,
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  // Transform to client format
  const calendarInterviews: CalendarInterview[] = interviews.map((i) => ({
    id: i.id,
    scheduledAt: i.scheduledAt.toISOString(),
    duration: i.duration,
    type: i.type,
    location: i.location,
    result: i.result,
    application: i.application,
  }));

  // Stats
  const now = new Date();
  const upcomingCount = interviews.filter(
    (i) => new Date(i.scheduledAt) > now && i.result === "PENDING"
  ).length;
  const thisMonthCount = interviews.filter((i) => {
    const date = new Date(i.scheduledAt);
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;
  const passedCount = interviews.filter((i) => i.result === "PASSED").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Interview Calendar
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Track all your scheduled interviews in one place
          </p>
        </div>
        <Link
          href="/applications"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back to Applications
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {upcomingCount}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Upcoming</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {thisMonthCount}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">This Month</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {passedCount}
              </p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Passed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <InterviewCalendar interviews={calendarInterviews} />

      {/* Legend */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-700 p-4">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Interview Types</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { type: "PHONE", color: "bg-blue-500", label: "Phone" },
            { type: "VIDEO", color: "bg-purple-500", label: "Video" },
            { type: "ONSITE", color: "bg-orange-500", label: "On-site" },
            { type: "TECHNICAL", color: "bg-cyan-500", label: "Technical" },
            { type: "BEHAVIORAL", color: "bg-pink-500", label: "Behavioral" },
            { type: "FINAL", color: "bg-emerald-500", label: "Final" },
          ].map(({ type, color, label }) => (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${color}`} />
              <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
