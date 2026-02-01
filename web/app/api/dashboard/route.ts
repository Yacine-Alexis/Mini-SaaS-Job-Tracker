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

  // Use database aggregation instead of loading all records into memory
  const [stageCounts, total, weeklyData] = await Promise.all([
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
    // Get weekly counts for last 8 weeks using raw aggregation
    (async () => {
      const now = new Date();
      const thisWeek = startOfISOWeek(now);
      const weeks: { weekStart: string; count: number }[] = [];

      // Get counts for each week in parallel
      const weekPromises = [];
      for (let i = 7; i >= 0; i--) {
        const ws = new Date(thisWeek);
        ws.setUTCDate(ws.getUTCDate() - i * 7);
        const we = new Date(ws);
        we.setUTCDate(we.getUTCDate() + 7);

        weekPromises.push(
          prisma.jobApplication.count({
            where: {
              userId,
              deletedAt: null,
              createdAt: { gte: ws, lt: we }
            }
          }).then(count => ({
            weekStart: ws.toISOString().slice(0, 10),
            count
          }))
        );
      }

      return Promise.all(weekPromises);
    })()
  ]);

  // Transform stageCounts from array to object
  const stageCountsObj: Record<string, number> = {};
  for (const item of stageCounts) {
    stageCountsObj[item.stage] = item._count.stage;
  }

  return NextResponse.json({
    stageCounts: stageCountsObj,
    weeklyApplications: weeklyData,
    total
  });
}
