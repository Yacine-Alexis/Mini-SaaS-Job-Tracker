import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/auth";
import { jsonError, zodToDetails } from "@/lib/errors";
import { noteCreateSchema, noteUpdateSchema } from "@/lib/validators/notes";
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

  // Ensure user owns application
  const app = await prisma.jobApplication.findFirst({
    where: { id: parsed.data.applicationId, userId, deletedAt: null },
    select: { id: true }
  });
  if (!app) return jsonError(404, "NOT_FOUND", "Application not found");

  const items = await prisma.note.findMany({
    where: { userId, applicationId: parsed.data.applicationId, deletedAt: null },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  // Rate limit: 30 notes per minute per IP
  const rl = await enforceRateLimitAsync(req, "notes:create", 30, 60_000);
  if (rl) return rl;

  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const raw = await req.json().catch(() => null);
  const parsed = noteCreateSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));

  const app = await prisma.jobApplication.findFirst({
    where: { id: parsed.data.applicationId, userId, deletedAt: null },
    select: { id: true }
  });
  if (!app) return jsonError(404, "NOT_FOUND", "Application not found");

  const created = await prisma.note.create({
    data: {
      userId,
      applicationId: parsed.data.applicationId,
      content: parsed.data.content
    }
  });

  await audit(req, userId, AuditAction.NOTE_CREATED, { entity: "Note", entityId: created.id });

  return NextResponse.json({ item: created }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const url = new URL(req.url);
  const noteId = url.searchParams.get("id");
  if (!noteId) return jsonError(400, "BAD_REQUEST", "Missing note id");

  const raw = await req.json().catch(() => null);
  const parsed = noteUpdateSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));

  const existing = await prisma.note.findFirst({
    where: { id: noteId, userId, deletedAt: null },
    select: { id: true }
  });
  if (!existing) return jsonError(404, "NOT_FOUND", "Note not found");

  const updated = await prisma.note.update({
    where: { id: noteId },
    data: { content: parsed.data.content }
  });

  await audit(req, userId, AuditAction.NOTE_UPDATED, { entity: "Note", entityId: updated.id });

  return NextResponse.json({ item: updated });
}

export async function DELETE(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const url = new URL(req.url);
  const noteId = url.searchParams.get("id");
  if (!noteId) return jsonError(400, "BAD_REQUEST", "Missing note id");

  const existing = await prisma.note.findFirst({
    where: { id: noteId, userId, deletedAt: null },
    select: { id: true }
  });
  if (!existing) return jsonError(404, "NOT_FOUND", "Note not found");

  await prisma.note.update({
    where: { id: noteId },
    data: { deletedAt: new Date() }
  });

  await audit(req, userId, AuditAction.NOTE_DELETED, { entity: "Note", entityId: noteId });

  return NextResponse.json({ ok: true });
}
