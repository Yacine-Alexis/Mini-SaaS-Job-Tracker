import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/auth";

function startOfISOWeek(d: Date) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay() || 7; // 1..7, Monday=1
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1));
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

export async function GET(_req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const apps = await prisma.jobApplication.findMany({
    where: { userId, deletedAt: null },
    select: { stage: true, createdAt: true }
  });

  const stageCounts: Record<string, number> = {};
  for (const a of apps) stageCounts[a.stage] = (stageCounts[a.stage] ?? 0) + 1;

  // last 8 weeks buckets
  const now = new Date();
  const thisWeek = startOfISOWeek(now);
  const weeks: { weekStart: string; count: number }[] = [];

  for (let i = 7; i >= 0; i--) {
    const ws = new Date(thisWeek);
    ws.setUTCDate(ws.getUTCDate() - i * 7);
    const we = new Date(ws);
    we.setUTCDate(we.getUTCDate() + 7);

    const count = apps.filter((a) => a.createdAt >= ws && a.createdAt < we).length;

    weeks.push({
      weekStart: ws.toISOString().slice(0, 10),
      count
    });
  }

  return NextResponse.json({
    stageCounts,
    weeklyApplications: weeks,
    total: apps.length
  });
}
