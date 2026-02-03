import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendInterviewReminderEmail } from "@/lib/email";
import type { InterviewItem } from "@/lib/emailTemplates";

/**
 * POST /api/reminders/interviews
 * 
 * Sends interview reminder emails to users with upcoming interviews.
 * This endpoint is designed to be called by a cron job (e.g., hourly).
 * 
 * Respects user email preferences:
 * - interviewReminder: boolean (enabled/disabled)
 * - interviewReminderHours: number (1-168 hours before interview)
 * - unsubscribedAll: boolean (global unsubscribe)
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
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  
  let sentCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  // Find all users with interview reminders enabled and not globally unsubscribed
  const usersWithPrefs = await prisma.emailPreferences.findMany({
    where: {
      interviewReminder: true,
      unsubscribedAll: false,
    },
    select: {
      userId: true,
      interviewReminderHours: true,
      user: {
        select: {
          email: true,
        }
      }
    }
  });

  for (const pref of usersWithPrefs) {
    if (!pref.user.email) continue;

    // Calculate the window for this user's preference
    // e.g., if interviewReminderHours = 24, find interviews between now and now + 24 hours
    // that haven't had a reminder sent yet
    const reminderWindow = new Date(now.getTime() + pref.interviewReminderHours * 60 * 60 * 1000);

    const upcomingInterviews = await prisma.interview.findMany({
      where: {
        userId: pref.userId,
        deletedAt: null,
        reminderSent: false,
        result: "PENDING", // Only pending interviews
        scheduledAt: {
          gt: now,           // In the future
          lte: reminderWindow // Within reminder window
        },
        application: {
          deletedAt: null    // Application not deleted
        }
      },
      include: {
        application: {
          select: {
            id: true,
            company: true,
            title: true
          }
        }
      },
      orderBy: { scheduledAt: "asc" }
    });

    for (const interview of upcomingInterviews) {
      const interviewItem: InterviewItem = {
        company: interview.application.company,
        title: interview.application.title,
        interviewDate: interview.scheduledAt,
        interviewType: formatInterviewType(interview.type),
        location: interview.location || undefined,
        meetingLink: interview.type === "VIDEO" ? interview.location || undefined : undefined,
        applicationId: interview.application.id
      };

      try {
        await sendInterviewReminderEmail({
          to: pref.user.email,
          interview: interviewItem,
          dashboardUrl: `${baseUrl}/applications/${interview.applicationId}`
        });

        // Mark reminder as sent
        await prisma.interview.update({
          where: { id: interview.id },
          data: { reminderSent: true }
        });

        sentCount++;
      } catch (err) {
        errors.push(
          `Failed to send interview reminder for interview ${interview.id}: ${
            err instanceof Error ? err.message : "Unknown error"
          }`
        );
      }
    }

    if (upcomingInterviews.length === 0) {
      skippedCount++;
    }
  }

  return NextResponse.json({
    success: true,
    sent: sentCount,
    usersChecked: usersWithPrefs.length,
    usersSkipped: skippedCount,
    errors: errors.length > 0 ? errors : undefined,
    timestamp: now.toISOString()
  });
}

/**
 * Format interview type enum to human-readable string
 */
function formatInterviewType(type: string): string {
  const typeMap: Record<string, string> = {
    PHONE: "Phone Screen",
    VIDEO: "Video Call",
    ONSITE: "On-site Interview",
    TECHNICAL: "Technical Interview",
    BEHAVIORAL: "Behavioral Interview",
    PANEL: "Panel Interview",
    FINAL: "Final Round",
    OTHER: "Interview"
  };
  return typeMap[type] || type;
}
