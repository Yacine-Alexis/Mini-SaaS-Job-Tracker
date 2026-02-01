import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendFollowUpReminderEmail } from "@/lib/email";
import type { ReminderItem } from "@/lib/emailTemplates";

/**
 * POST /api/reminders/send
 * 
 * Sends follow-up reminder emails to users with tasks due today or overdue.
 * This endpoint is designed to be called by a cron job (e.g., daily at 8am).
 * 
 * Requires CRON_SECRET env var for authentication.
 */
export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  // Find all users with open tasks due today or overdue
  const usersWithTasks = await prisma.user.findMany({
    where: {
      tasks: {
        some: {
          status: "OPEN",
          deletedAt: null,
          dueDate: { lte: endOfToday },
          application: { deletedAt: null }
        }
      }
    },
    select: {
      id: true,
      email: true,
      tasks: {
        where: {
          status: "OPEN",
          deletedAt: null,
          dueDate: { lte: endOfToday },
          application: { deletedAt: null }
        },
        orderBy: { dueDate: "asc" },
        take: 10, // Limit to 10 tasks per email
        include: {
          application: {
            select: { id: true, company: true, title: true }
          }
        }
      }
    }
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  let sentCount = 0;
  const errors: string[] = [];

  for (const user of usersWithTasks) {
    if (!user.email || user.tasks.length === 0) continue;

    const items: ReminderItem[] = user.tasks.map(task => ({
      company: task.application.company,
      title: task.application.title,
      taskTitle: task.title,
      dueDate: task.dueDate 
        ? task.dueDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
        : "No due date",
      applicationUrl: `${baseUrl}/applications/${task.application.id}`
    }));

    try {
      await sendFollowUpReminderEmail({
        to: user.email,
        items,
        dashboardUrl: `${baseUrl}/dashboard`
      });
      sentCount++;
    } catch (err) {
      errors.push(`Failed to send to ${user.email}: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  }

  return NextResponse.json({
    success: true,
    sent: sentCount,
    total: usersWithTasks.length,
    errors: errors.length > 0 ? errors : undefined
  });
}
