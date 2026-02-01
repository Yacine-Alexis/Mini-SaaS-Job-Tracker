import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/db";
import WeeklyBarChart from "@/components/WeeklyBarChart";
import OnboardingCard from "@/components/OnboardingCard";

function startOfISOWeek(d: Date) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1));
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="card p-6">
        <h1 className="text-xl font-semibold">Welcome</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Sign in to start tracking applications.
        </p>
        <div className="mt-4 flex gap-2">
          <Link className="btn btn-primary" href="/login">Sign in</Link>
          <Link className="btn" href="/register">Create account</Link>
        </div>
      </div>
    );
  }

  const userId = (session.user as { id: string }).id;

  const now = new Date();
  const thisWeek = startOfISOWeek(now);

  // Use database aggregations instead of loading all applications into memory
  const [
    stageCountsRaw,
    total,
    tasks,
    recentApps,
    weeklyData,
    salaryStats
  ] = await Promise.all([
    // Count by stage using groupBy
    prisma.jobApplication.groupBy({
      by: ["stage"],
      where: { userId, deletedAt: null },
      _count: { stage: true }
    }),
    // Total count
    prisma.jobApplication.count({
      where: { userId, deletedAt: null }
    }),
    // Tasks with upcoming due dates
    prisma.task.findMany({
      where: { application: { userId, deletedAt: null }, deletedAt: null, status: "OPEN" },
      orderBy: { dueDate: "asc" },
      take: 5,
      include: { application: { select: { company: true } } }
    }),
    // Recent applications
    prisma.jobApplication.findMany({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, company: true, title: true, stage: true, updatedAt: true }
    }),
    // Weekly counts using parallel queries (database aggregation)
    (async () => {
      const weekPromises = [];
      for (let i = 7; i >= 0; i--) {
        const ws = new Date(thisWeek);
        ws.setUTCDate(ws.getUTCDate() - i * 7);
        const we = new Date(ws);
        we.setUTCDate(we.getUTCDate() + 7);
        weekPromises.push(
          prisma.jobApplication.count({
            where: { userId, deletedAt: null, createdAt: { gte: ws, lt: we } }
          }).then(count => ({ weekStart: ws.toISOString().slice(0, 10), count }))
        );
      }
      return Promise.all(weekPromises);
    })(),
    // Average salary using database aggregation
    prisma.jobApplication.aggregate({
      where: { userId, deletedAt: null, OR: [{ salaryMin: { not: null } }, { salaryMax: { not: null } }] },
      _avg: { salaryMin: true, salaryMax: true },
      _count: true
    })
  ]);

  // Transform stage counts from array to object
  const stageCounts: Record<string, number> = {};
  for (const item of stageCountsRaw) {
    stageCounts[item.stage] = item._count.stage;
  }

  const isEmpty = total === 0;
  const weeklyApplications = weeklyData;
  const appliedLike = (stageCounts["APPLIED"] ?? 0) + (stageCounts["INTERVIEW"] ?? 0) + (stageCounts["OFFER"] ?? 0) + (stageCounts["REJECTED"] ?? 0);
  const responded = (stageCounts["INTERVIEW"] ?? 0) + (stageCounts["OFFER"] ?? 0) + (stageCounts["REJECTED"] ?? 0);
  const responseRate = appliedLike > 0 ? Math.round((responded / appliedLike) * 100) : 0;
  const active = total - (stageCounts["REJECTED"] ?? 0);

  // Calculate average salary from aggregation
  const avgMin = salaryStats._avg.salaryMin ?? 0;
  const avgMax = salaryStats._avg.salaryMax ?? 0;
  const avgSalary = salaryStats._count > 0 ? Math.round((avgMin + avgMax) / 2) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Welcome back! 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Here&apos;s what&apos;s happening with your job search today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all hover:scale-[1.02]"
            href="/applications/new"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Application
          </Link>
          <Link className="btn" href="/applications">View All</Link>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Applications"
          value={String(total)}
          icon={<BriefcaseIcon />}
          color="blue"
        />
        <StatCard
          label="Active Pipeline"
          value={String(active)}
          icon={<TrendingIcon />}
          color="green"
        />
        <StatCard
          label="Response Rate"
          value={`${responseRate}%`}
          icon={<ChartIcon />}
          color="purple"
        />
        <StatCard
          label="Interviews"
          value={String(stageCounts["INTERVIEW"] ?? 0)}
          icon={<CalendarIcon />}
          color="orange"
        />
      </div>

      {isEmpty && <OnboardingCard />}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chart & Pipeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Chart */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Weekly Activity</h2>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Last 8 weeks</span>
            </div>
            <WeeklyBarChart data={weeklyApplications} />
          </div>

          {/* Pipeline Overview */}
          <div className="card p-6">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Pipeline Overview</h2>
            <div className="space-y-3">
              <PipelineRow
                stage="Saved"
                count={stageCounts["SAVED"] ?? 0}
                total={total}
                color="bg-zinc-400"
                emoji="📌"
              />
              <PipelineRow
                stage="Applied"
                count={stageCounts["APPLIED"] ?? 0}
                total={total}
                color="bg-blue-500"
                emoji="📤"
              />
              <PipelineRow
                stage="Interview"
                count={stageCounts["INTERVIEW"] ?? 0}
                total={total}
                color="bg-amber-500"
                emoji="🎤"
              />
              <PipelineRow
                stage="Offer"
                count={stageCounts["OFFER"] ?? 0}
                total={total}
                color="bg-green-500"
                emoji="🎉"
              />
              <PipelineRow
                stage="Rejected"
                count={stageCounts["REJECTED"] ?? 0}
                total={total}
                color="bg-red-400"
                emoji="❌"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Tasks & Recent */}
        <div className="space-y-6">
          {/* Upcoming Tasks */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Upcoming Tasks</h2>
              <Link href="/applications" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View all</Link>
            </div>
            {tasks.length > 0 ? (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="mt-0.5 h-4 w-4 rounded-full border-2 border-zinc-300 dark:border-zinc-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{task.title}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{task.application.company}</p>
                      {task.dueDate && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-zinc-500 dark:text-zinc-400">
                <svg className="mx-auto h-8 w-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm">No pending tasks</p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Recent Activity</h2>
            </div>
            {recentApps.length > 0 ? (
              <div className="space-y-3">
                {recentApps.map((app) => (
                  <Link
                    key={app.id}
                    href={`/applications/${app.id}`}
                    className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {app.company.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{app.company}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{app.title}</p>
                    </div>
                    <StageBadge stage={app.stage} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-zinc-500 dark:text-zinc-400">
                <p className="text-sm">No applications yet</p>
              </div>
            )}
          </div>

          {/* Insights Card */}
          <div className="card p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-indigo-100 dark:border-indigo-900/50">
            <h2 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-3">💡 Quick Insights</h2>
            <div className="space-y-2 text-sm text-indigo-700 dark:text-indigo-300">
              {avgSalary > 0 && (
                <p>• Avg. target salary: <span className="font-semibold">${avgSalary.toLocaleString()}</span></p>
              )}
              {appliedLike > 0 && (
                <p>• You&apos;ve applied to <span className="font-semibold">{appliedLike}</span> positions</p>
              )}
              {(stageCounts["OFFER"] ?? 0) > 0 && (
                <p>• 🎉 You have <span className="font-semibold">{stageCounts["OFFER"]}</span> active offer(s)!</p>
              )}
              {total === 0 && (
                <p>• Start by adding your first job application!</p>
              )}
              {total > 0 && responseRate < 20 && (
                <p>• Tip: Consider tailoring your resume for each application</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickActionButton
            href="/applications/new"
            icon={<PlusIcon />}
            label="New Application"
          />
          <QuickActionButton
            href="/applications/import"
            icon={<UploadIcon />}
            label="Import CSV"
          />
          <QuickActionButton
            href="/applications"
            icon={<ListIcon />}
            label="All Applications"
          />
          <QuickActionButton
            href="/settings/account"
            icon={<SettingsIcon />}
            label="Settings"
          />
        </div>
      </div>
    </div>
  );
}

// Component helpers
function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: "blue" | "green" | "purple" | "orange" }) {
  const colorClasses = {
    blue: "from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20 text-blue-600 dark:text-blue-400",
    green: "from-green-500/10 to-green-600/10 dark:from-green-500/20 dark:to-green-600/20 text-green-600 dark:text-green-400",
    purple: "from-purple-500/10 to-purple-600/10 dark:from-purple-500/20 dark:to-purple-600/20 text-purple-600 dark:text-purple-400",
    orange: "from-orange-500/10 to-orange-600/10 dark:from-orange-500/20 dark:to-orange-600/20 text-orange-600 dark:text-orange-400"
  };

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${colorClasses[color]} mb-3`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{label}</div>
    </div>
  );
}

function PipelineRow({ stage, count, total, color, emoji }: { stage: string; count: number; total: number; color: string; emoji: string }) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">{emoji}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-zinc-700 dark:text-zinc-300">{stage}</span>
          <span className="text-zinc-500 dark:text-zinc-400">{count}</span>
        </div>
        <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-700 overflow-hidden">
          <div
            className={`h-full rounded-full ${color} transition-all duration-500`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const styles: Record<string, string> = {
    SAVED: "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
    APPLIED: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    INTERVIEW: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
    OFFER: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300"
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[stage] || styles.SAVED}`}>
      {stage.charAt(0) + stage.slice(1).toLowerCase()}
    </span>
  );
}

function QuickActionButton({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all text-center group"
    >
      <span className="text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
        {icon}
      </span>
      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
    </Link>
  );
}

// Icons
function BriefcaseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function TrendingIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
