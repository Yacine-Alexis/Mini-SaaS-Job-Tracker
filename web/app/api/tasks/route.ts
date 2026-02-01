import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/auth";
import { jsonError, zodToDetails } from "@/lib/errors";
import { taskCreateSchema, taskUpdateSchema } from "@/lib/validators/tasks";
import { listByApplicationSchema } from "@/lib/validators/shared";
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit";
import { enforceRateLimitAsync } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const url = new URL(req.url);
  const parsed = listByApplicationSchema.safeParse({
    applicationId: url.searchParams.get("applicationId") ?? undefined
  });
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "Invalid query", zodToDetails(parsed.error));

  const app = await prisma.jobApplication.findFirst({
    where: { id: parsed.data.applicationId, userId, deletedAt: null },
    select: { id: true }
  });
  if (!app) return jsonError(404, "NOT_FOUND", "Application not found");

  const items = await prisma.task.findMany({
    where: { userId, applicationId: parsed.data.applicationId, deletedAt: null },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }]
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  // Rate limit: 30 tasks per minute per IP
  const rl = await enforceRateLimitAsync(req, "tasks:create", 30, 60_000);
  if (rl) return rl;

  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const raw = await req.json().catch(() => null);
  const parsed = taskCreateSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));

  const app = await prisma.jobApplication.findFirst({
    where: { id: parsed.data.applicationId, userId, deletedAt: null },
    select: { id: true }
  });
  if (!app) return jsonError(404, "NOT_FOUND", "Application not found");

  const created = await prisma.task.create({
    data: {
      userId,
      applicationId: parsed.data.applicationId,
      title: parsed.data.title,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      status: parsed.data.status ?? undefined
    }
  });

  await audit(req, userId, AuditAction.TASK_CREATED, { entity: "Task", entityId: created.id });

  return NextResponse.json({ item: created }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const url = new URL(req.url);
  const taskId = url.searchParams.get("id");
  if (!taskId) return jsonError(400, "BAD_REQUEST", "Missing task id");

  const raw = await req.json().catch(() => null);
  const parsed = taskUpdateSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));

  const existing = await prisma.task.findFirst({
    where: { id: taskId, userId, deletedAt: null },
    select: { id: true }
  });
  if (!existing) return jsonError(404, "NOT_FOUND", "Task not found");

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...parsed.data,
      dueDate:
        parsed.data.dueDate ? new Date(parsed.data.dueDate)
        : parsed.data.dueDate === null ? null
        : undefined
    }
  });

  await audit(req, userId, AuditAction.TASK_UPDATED, { entity: "Task", entityId: updated.id });

  return NextResponse.json({ item: updated });
}

export async function DELETE(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const url = new URL(req.url);
  const taskId = url.searchParams.get("id");
  if (!taskId) return jsonError(400, "BAD_REQUEST", "Missing task id");

  const existing = await prisma.task.findFirst({
    where: { id: taskId, userId, deletedAt: null },
    select: { id: true }
  });
  if (!existing) return jsonError(404, "NOT_FOUND", "Task not found");

  await prisma.task.update({
    where: { id: taskId },
    data: { deletedAt: new Date() }
  });

  await audit(req, userId, AuditAction.TASK_DELETED, { entity: "Task", entityId: taskId });

  return NextResponse.json({ ok: true });
}
