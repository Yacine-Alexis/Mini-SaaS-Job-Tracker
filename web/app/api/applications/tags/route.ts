import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/auth";

export async function GET(_req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  // Get all applications with their tags
  const applications = await prisma.jobApplication.findMany({
    where: { userId, deletedAt: null },
    select: { tags: true },
  });

  // Count tag occurrences
  const tagCounts = new Map<string, number>();
  for (const app of applications) {
    for (const tag of app.tags) {
      const normalizedTag = tag.toLowerCase().trim();
      tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
    }
  }

  // Convert to sorted array
  const tags = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ tags });
}
