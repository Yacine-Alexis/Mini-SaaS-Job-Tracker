import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, zodToDetails } from "@/lib/errors";
import { requireUserOr401 } from "@/lib/auth";
import { interviewCreateSchema, interviewUpdateSchema, interviewListQuerySchema } from "@/lib/validators/interviews";
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const url = new URL(req.url);
  const parsed = interviewListQuerySchema.safeParse({
    applicationId: url.searchParams.get("applicationId") ?? undefined,
    upcoming: url.searchParams.get("upcoming") ?? undefined,
    result: url.searchParams.get("result") ?? undefined
  });

  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid query", zodToDetails(parsed.error));
  }

  const { applicationId, upcoming, result } = parsed.data;

  // Build where clause
  const where: any = { userId, deletedAt: null };
  
  if (applicationId) {
    // Verify application belongs to user
    const app = await prisma.jobApplication.findFirst({
      where: { id: applicationId, userId, deletedAt: null },
      select: { id: true }
    });
    if (!app) return jsonError(404, "NOT_FOUND", "Application not found");
    where.applicationId = applicationId;
  }

  if (upcoming === "true") {
    where.scheduledAt = { gte: new Date() };
  }

  if (result) {
    where.result = result;
  }

  const items = await prisma.interview.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    include: {
      application: {
        select: { id: true, company: true, title: true }
      }
    }
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const raw = await req.json().catch(() => null);
  const parsed = interviewCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));
  }

  const { applicationId, ...data } = parsed.data;

  // Verify application belongs to user
  const app = await prisma.jobApplication.findFirst({
    where: { id: applicationId, userId, deletedAt: null },
    select: { id: true }
  });
  if (!app) return jsonError(404, "NOT_FOUND", "Application not found");

  const interview = await prisma.interview.create({
    data: {
      userId,
      applicationId,
      scheduledAt: new Date(data.scheduledAt),
      duration: data.duration ?? null,
      type: data.type ?? "VIDEO",
      location: data.location ?? null,
      interviewers: data.interviewers ?? [],
      notes: data.notes ?? null,
      feedback: data.feedback ?? null,
      result: data.result ?? "PENDING"
    },
    include: {
      application: {
        select: { id: true, company: true, title: true }
      }
    }
  });

  await audit(req, userId, AuditAction.INTERVIEW_CREATED, { 
    entity: "Interview", 
    entityId: interview.id,
    meta: { applicationId }
  });

  return NextResponse.json({ item: interview }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return jsonError(400, "BAD_REQUEST", "Missing id parameter");

  const raw = await req.json().catch(() => null);
  const parsed = interviewUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));
  }

  // Verify interview belongs to user
  const existing = await prisma.interview.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true }
  });
  if (!existing) return jsonError(404, "NOT_FOUND", "Interview not found");

  const data = parsed.data;

  const updated = await prisma.interview.update({
    where: { id },
    data: {
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      duration: data.duration,
      type: data.type,
      location: data.location,
      interviewers: data.interviewers,
      notes: data.notes,
      feedback: data.feedback,
      result: data.result
    },
    include: {
      application: {
        select: { id: true, company: true, title: true }
      }
    }
  });

  await audit(req, userId, AuditAction.INTERVIEW_UPDATED, { 
    entity: "Interview", 
    entityId: updated.id 
  });

  return NextResponse.json({ item: updated });
}

export async function DELETE(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return jsonError(400, "BAD_REQUEST", "Missing id parameter");

  // Verify interview belongs to user
  const existing = await prisma.interview.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true }
  });
  if (!existing) return jsonError(404, "NOT_FOUND", "Interview not found");

  await prisma.interview.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  await audit(req, userId, AuditAction.INTERVIEW_DELETED, { 
    entity: "Interview", 
    entityId: id 
  });

  return NextResponse.json({ ok: true });
}
