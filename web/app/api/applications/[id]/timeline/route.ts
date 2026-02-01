import { NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/applications/[id]/timeline - Get application activity timeline
export async function GET(req: NextRequest, ctx: RouteContext) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const { id } = await ctx.params;

  // Verify application belongs to user
  const app = await prisma.jobApplication.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true, createdAt: true },
  });
  if (!app) {
    return jsonError(404, "NOT_FOUND", "Application not found");
  }

  // Fetch audit logs for this application
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      userId,
      entityId: id,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Fetch related notes
  const notes = await prisma.note.findMany({
    where: { applicationId: id, deletedAt: null },
    select: { id: true, content: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Fetch related tasks
  const tasks = await prisma.task.findMany({
    where: { applicationId: id, deletedAt: null },
    select: { id: true, title: true, status: true, createdAt: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Fetch related interviews
  const interviews = await prisma.interview.findMany({
    where: { applicationId: id, deletedAt: null },
    select: { id: true, type: true, scheduledAt: true, result: true, createdAt: true },
    orderBy: { scheduledAt: "desc" },
    take: 20,
  });

  // Fetch related contacts
  const contacts = await prisma.contact.findMany({
    where: { applicationId: id, deletedAt: null },
    select: { id: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Build timeline events
  type TimelineEvent = {
    id: string;
    type: "audit" | "note" | "task" | "interview" | "contact" | "created";
    title: string;
    description?: string;
    date: string;
    icon: string;
    color: string;
    meta?: Record<string, unknown>;
  };

  const events: TimelineEvent[] = [];

  // Application creation event
  events.push({
    id: `created-${app.id}`,
    type: "created",
    title: "Application created",
    date: app.createdAt.toISOString(),
    icon: "plus",
    color: "green",
  });

  // Audit log events
  for (const log of auditLogs) {
    const action = log.action;
    let title = action.replace(/_/g, " ").toLowerCase();
    title = title.charAt(0).toUpperCase() + title.slice(1);
    
    let icon = "info";
    let color = "blue";
    
    if (action.includes("CREATED")) {
      icon = "plus";
      color = "green";
    } else if (action.includes("UPDATED")) {
      icon = "edit";
      color = "blue";
    } else if (action.includes("DELETED")) {
      icon = "trash";
      color = "red";
    }

    events.push({
      id: log.id,
      type: "audit",
      title,
      description: log.entity ?? undefined,
      date: log.createdAt.toISOString(),
      icon,
      color,
      meta: log.meta as Record<string, unknown> | undefined,
    });
  }

  // Note events
  for (const note of notes) {
    events.push({
      id: `note-${note.id}`,
      type: "note",
      title: "Note added",
      description: note.content.slice(0, 100) + (note.content.length > 100 ? "..." : ""),
      date: note.createdAt.toISOString(),
      icon: "note",
      color: "yellow",
    });
  }

  // Task events
  for (const task of tasks) {
    events.push({
      id: `task-${task.id}`,
      type: "task",
      title: task.status === "DONE" ? "Task completed" : "Task created",
      description: task.title,
      date: task.status === "DONE" ? task.updatedAt.toISOString() : task.createdAt.toISOString(),
      icon: task.status === "DONE" ? "check" : "task",
      color: task.status === "DONE" ? "green" : "purple",
    });
  }

  // Interview events
  for (const interview of interviews) {
    let title = `Interview scheduled: ${interview.type}`;
    if (interview.result === "PASSED") title = `Interview passed: ${interview.type}`;
    else if (interview.result === "FAILED") title = `Interview failed: ${interview.type}`;
    
    events.push({
      id: `interview-${interview.id}`,
      type: "interview",
      title,
      description: interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleString() : undefined,
      date: interview.createdAt.toISOString(),
      icon: "calendar",
      color: interview.result === "PASSED" ? "green" : interview.result === "FAILED" ? "red" : "indigo",
    });
  }

  // Contact events
  for (const contact of contacts) {
    events.push({
      id: `contact-${contact.id}`,
      type: "contact",
      title: "Contact added",
      description: `${contact.name}${contact.role ? ` (${contact.role})` : ""}`,
      date: contact.createdAt.toISOString(),
      icon: "user",
      color: "teal",
    });
  }

  // Sort by date descending
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({ events });
}
