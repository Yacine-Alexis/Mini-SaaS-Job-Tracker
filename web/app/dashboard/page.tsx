import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/db";
import WeeklyBarChart from "@/components/WeeklyBarChart";

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
        <p className="mt-2 text-sm text-zinc-600">
          Sign in to start tracking applications.
        </p>
        <div className="mt-4 flex gap-2">
          <Link className="btn btn-primary" href="/login">Sign in</Link>
          <Link className="btn" href="/register">Create account</Link>
        </div>
      </div>
    );
  }

  const userId = (session.user as any).id as string;

  const apps = await prisma.jobApplication.findMany({
    where: { userId, deletedAt: null },
    select: { stage: true, createdAt: true }
  });

  const stageCounts: Record<string, number> = {};
  for (const a of apps) stageCounts[a.stage] = (stageCounts[a.stage] ?? 0) + 1;

  const total = apps.length;

  const now = new Date();
  const thisWeek = startOfISOWeek(now);
  const weeklyApplications: { weekStart: string; count: number }[] = [];
  const appliedLike = (stageCounts["APPLIED"] ?? 0) + (stageCounts["INTERVIEW"] ?? 0) + (stageCounts["OFFER"] ?? 0) + (stageCounts["REJECTED"] ?? 0);
  const responded = (stageCounts["INTERVIEW"] ?? 0) + (stageCounts["OFFER"] ?? 0) + (stageCounts["REJECTED"] ?? 0);
  const responseRate = appliedLike > 0 ? Math.round((responded / appliedLike) * 100) : 0;
  const active = total - (stageCounts["REJECTED"] ?? 0);

  for (let i = 7; i >= 0; i--) {
    const ws = new Date(thisWeek);
    ws.setUTCDate(ws.getUTCDate() - i * 7);
    const we = new Date(ws);
    we.setUTCDate(we.getUTCDate() + 7);

    const count = apps.filter((a) => a.createdAt >= ws && a.createdAt < we).length;

    weeklyApplications.push({
      weekStart: ws.toISOString().slice(0, 10),
      count
    });
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Your job search at a glance.
            </p>
          </div>
          <div className="flex gap-2">
            <Link className="btn btn-primary" href="/applications/new">New application</Link>
            <Link className="btn" href="/applications">View applications</Link>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
          <MetricCard label="Total applications" value={String(total)} />
          <MetricCard label="Active" value={String(active)} />
          <MetricCard label="Response rate" value={`${responseRate}%`} />
          <MetricCard label="Interviews" value={String(stageCounts["INTERVIEW"] ?? 0)} />
        </div>


        <WeeklyBarChart data={weeklyApplications} />
      </div>

      <div className="card p-6">
        <h2 className="font-semibold">By stage</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(stageCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([stage, count]) => (
              <span key={stage} className="badge">
                {stage}: {count}
              </span>
            ))}
          {Object.keys(stageCounts).length === 0 && (
            <div className="text-sm text-zinc-600">No data yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
