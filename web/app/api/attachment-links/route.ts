import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/auth";
import { jsonError, zodToDetails } from "@/lib/errors";
import { attachmentLinkCreateSchema, attachmentLinkUpdateSchema } from "@/lib/validators/attachmentLinks";
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

  const items = await prisma.attachmentLink.findMany({
    where: { userId, applicationId: parsed.data.applicationId, deletedAt: null },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  // Rate limit: 30 links per minute per IP
  const rl = await enforceRateLimitAsync(req, "links:create", 30, 60_000);
  if (rl) return rl;

  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const raw = await req.json().catch(() => null);
  const parsed = attachmentLinkCreateSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));

  const app = await prisma.jobApplication.findFirst({
    where: { id: parsed.data.applicationId, userId, deletedAt: null },
    select: { id: true }
  });
  if (!app) return jsonError(404, "NOT_FOUND", "Application not found");

  const created = await prisma.attachmentLink.create({
    data: {
      userId,
      applicationId: parsed.data.applicationId,
      label: parsed.data.label ?? null,
      url: parsed.data.url
    }
  });

  await audit(req, userId, AuditAction.LINK_CREATED, { entity: "AttachmentLink", entityId: created.id });

  return NextResponse.json({ item: created }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return jsonError(400, "BAD_REQUEST", "Missing attachment link id");

  const raw = await req.json().catch(() => null);
  const parsed = attachmentLinkUpdateSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));

  const existing = await prisma.attachmentLink.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true }
  });
  if (!existing) return jsonError(404, "NOT_FOUND", "Attachment link not found");

  const updated = await prisma.attachmentLink.update({
    where: { id },
    data: parsed.data
  });

  await audit(req, userId, AuditAction.LINK_UPDATED, { entity: "AttachmentLink", entityId: updated.id });

  return NextResponse.json({ item: updated });
}

export async function DELETE(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return jsonError(400, "BAD_REQUEST", "Missing attachment link id");

  const existing = await prisma.attachmentLink.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true }
  });
  if (!existing) return jsonError(404, "NOT_FOUND", "Attachment link not found");

  await prisma.attachmentLink.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  await audit(req, userId, AuditAction.LINK_DELETED, { entity: "AttachmentLink", entityId: id });

  return NextResponse.json({ ok: true });
}
