import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const metadata = {
  title: "Analytics - Job Tracker",
  description: "View insights and analytics about your job search"
};

function startOfISOWeek(d: Date) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7;
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1));
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const now = new Date();
  const thisWeek = startOfISOWeek(now);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const [
    totalApps,
    stageCounts,
    monthlyApps,
    weeklyTrend,
    interviewStats,
    sourceStats,
    avgTimeToInterview,
    topCompanies
  ] = await Promise.all([
    // Total applications
    prisma.jobApplication.count({ where: { userId, deletedAt: null } }),
    
    // Stage breakdown
    prisma.jobApplication.groupBy({
      by: ["stage"],
      where: { userId, deletedAt: null },
      _count: { stage: true }
    }),
    
    // Apps in last 30 days
    prisma.jobApplication.count({
      where: { userId, deletedAt: null, createdAt: { gte: thirtyDaysAgo } }
    }),
    
    // Weekly trend (8 weeks)
    (async () => {
      const weeks = [];
      for (let i = 7; i >= 0; i--) {
        const ws = new Date(thisWeek);
        ws.setUTCDate(ws.getUTCDate() - i * 7);
        const we = new Date(ws);
        we.setUTCDate(we.getUTCDate() + 7);
        const count = await prisma.jobApplication.count({
          where: { userId, deletedAt: null, createdAt: { gte: ws, lt: we } }
        });
        weeks.push({ week: ws.toISOString().slice(0, 10), count });
      }
      return weeks;
    })(),
    
    // Interview statistics
    prisma.interview.groupBy({
      by: ["result"],
      where: { userId, deletedAt: null },
      _count: { result: true }
    }),
    
    // Source breakdown
    prisma.jobApplication.groupBy({
      by: ["source"],
      where: { userId, deletedAt: null, source: { not: null } },
      _count: { source: true },
      orderBy: { _count: { source: "desc" } },
      take: 5
    }),
    
    // Average time from application to first interview
    (async () => {
      const appsWithInterviews = await prisma.jobApplication.findMany({
        where: {
          userId,
          deletedAt: null,
          interviews: { some: { deletedAt: null } }
        },
        select: {
          createdAt: true,
          interviews: {
            where: { deletedAt: null },
            orderBy: { scheduledAt: "asc" },
            take: 1,
            select: { scheduledAt: true }
          }
        }
      });
      
      if (appsWithInterviews.length === 0) return null;
      
      const daysToInterview = appsWithInterviews
        .filter(app => app.interviews.length > 0)
        .map(app => {
          const appDate = new Date(app.createdAt).getTime();
          const intDate = new Date(app.interviews[0].scheduledAt).getTime();
          return Math.max(0, Math.round((intDate - appDate) / (1000 * 60 * 60 * 24)));
        });
      
      return daysToInterview.length > 0
        ? Math.round(daysToInterview.reduce((a, b) => a + b, 0) / daysToInterview.length)
        : null;
    })(),
    
    // Top companies applied to
    prisma.jobApplication.groupBy({
      by: ["company"],
      where: { userId, deletedAt: null },
      _count: { company: true },
      orderBy: { _count: { company: "desc" } },
      take: 5
    })
  ]);

  // Transform data
  const stageMap: Record<string, number> = {};
  for (const s of stageCounts) stageMap[s.stage] = s._count.stage;
  
  const interviewMap: Record<string, number> = {};
  for (const i of interviewStats) interviewMap[i.result] = i._count.result;
  
  const totalInterviews = Object.values(interviewMap).reduce((a, b) => a + b, 0);
  const passedInterviews = (interviewMap["PASSED"] ?? 0) + (interviewMap["OFFER"] ?? 0);
  const interviewSuccessRate = totalInterviews > 0 ? Math.round((passedInterviews / totalInterviews) * 100) : 0;
  
  const applied = (stageMap["APPLIED"] ?? 0) + (stageMap["INTERVIEW"] ?? 0) + (stageMap["OFFER"] ?? 0) + (stageMap["REJECTED"] ?? 0);
  const responded = (stageMap["INTERVIEW"] ?? 0) + (stageMap["OFFER"] ?? 0) + (stageMap["REJECTED"] ?? 0);
  const responseRate = applied > 0 ? Math.round((responded / applied) * 100) : 0;
  
  const offerRate = applied > 0 ? Math.round(((stageMap["OFFER"] ?? 0) / applied) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Analytics</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Insights from your job search journey
          </p>
        </div>
        <Link href="/dashboard" className="btn">← Back to Dashboard</Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Applications" value={totalApps} />
        <MetricCard label="Last 30 Days" value={monthlyApps} />
        <MetricCard label="Response Rate" value={`${responseRate}%`} />
        <MetricCard label="Offer Rate" value={`${offerRate}%`} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <div className="card p-6">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Application Pipeline</h2>
          <div className="space-y-3">
            <FunnelBar stage="Saved" count={stageMap["SAVED"] ?? 0} total={totalApps} color="bg-zinc-400" />
            <FunnelBar stage="Applied" count={stageMap["APPLIED"] ?? 0} total={totalApps} color="bg-blue-500" />
            <FunnelBar stage="Interview" count={stageMap["INTERVIEW"] ?? 0} total={totalApps} color="bg-amber-500" />
            <FunnelBar stage="Offer" count={stageMap["OFFER"] ?? 0} total={totalApps} color="bg-green-500" />
            <FunnelBar stage="Rejected" count={stageMap["REJECTED"] ?? 0} total={totalApps} color="bg-red-400" />
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="card p-6">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Weekly Activity</h2>
          <div className="flex items-end gap-2 h-40">
            {weeklyTrend.map((w, i) => {
              const max = Math.max(...weeklyTrend.map(x => x.count), 1);
              const height = (w.count / max) * 100;
              return (
                <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-zinc-500">{w.count}</span>
                  <div 
                    className={`w-full rounded-t transition-all ${i === weeklyTrend.length - 1 ? "bg-blue-500" : "bg-zinc-300 dark:bg-zinc-600"}`}
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-[10px] text-zinc-400">{new Date(w.week).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interview & Source Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interview Stats */}
        <div className="card p-6">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Interview Performance</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Interviews</span>
              <span className="font-semibold">{totalInterviews}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Success Rate</span>
              <span className={`font-semibold ${interviewSuccessRate >= 50 ? "text-green-600" : "text-amber-600"}`}>
                {interviewSuccessRate}%
              </span>
            </div>
            {avgTimeToInterview !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Avg. Days to Interview</span>
                <span className="font-semibold">{avgTimeToInterview} days</span>
              </div>
            )}
          </div>
        </div>

        {/* Top Sources */}
        <div className="card p-6">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Top Sources</h2>
          {sourceStats.length > 0 ? (
            <div className="space-y-3">
              {sourceStats.map((s) => (
                <div key={s.source} className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400 truncate">{s.source}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{s._count.source}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No source data yet</p>
          )}
        </div>

        {/* Top Companies */}
        <div className="card p-6">
          <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4">Top Companies</h2>
          {topCompanies.length > 0 ? (
            <div className="space-y-3">
              {topCompanies.map((c) => (
                <div key={c.company} className="flex justify-between items-center">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400 truncate">{c.company}</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{c._count.company}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No applications yet</p>
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-100 dark:border-blue-900/50">
        <h2 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Insights</h2>
        <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
          {responseRate < 20 && totalApps > 5 && (
            <p>• Your response rate is below 20%. Consider customizing your resume for each application.</p>
          )}
          {monthlyApps < 10 && (
            <p>• You&apos;ve applied to {monthlyApps} jobs this month. Aim for 10-15 quality applications per week.</p>
          )}
          {(stageMap["INTERVIEW"] ?? 0) > 0 && (stageMap["OFFER"] ?? 0) === 0 && (
            <p>• You&apos;re getting interviews! Focus on interview prep to convert them to offers.</p>
          )}
          {(stageMap["OFFER"] ?? 0) > 0 && (
            <p>• Congratulations on your offer(s)! Take time to evaluate and negotiate.</p>
          )}
          {totalApps === 0 && (
            <p>• Get started by adding your first job application!</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{label}</div>
    </div>
  );
}

function FunnelBar({ stage, count, total, color }: { stage: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-zinc-700 dark:text-zinc-300">{stage}</span>
        <span className="text-zinc-500">{count} ({pct}%)</span>
      </div>
      <div className="h-3 rounded-full bg-zinc-100 dark:bg-zinc-700 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
