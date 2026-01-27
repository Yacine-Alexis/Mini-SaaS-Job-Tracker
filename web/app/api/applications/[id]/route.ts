import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, zodToDetails } from "@/lib/errors";
import { requireUserOr401 } from "@/lib/auth";
import { applicationUpdateSchema } from "@/lib/validators/applications";
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const { id } = await ctx.params;
  const item = await prisma.jobApplication.findFirst({
    where: { id, userId, deletedAt: null }
  });

  if (!item) return jsonError(404, "NOT_FOUND", "Application not found");
  return NextResponse.json({ item });
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const raw = await req.json().catch(() => null);
  const parsed = applicationUpdateSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));

  const { id } = await ctx.params;
  const existing = await prisma.jobApplication.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true }
  });
  if (!existing) return jsonError(404, "NOT_FOUND", "Application not found");

  const updated = await prisma.jobApplication.update({
    where: { id },
    data: {
      ...parsed.data,
      appliedDate: parsed.data.appliedDate ? new Date(parsed.data.appliedDate) : parsed.data.appliedDate === null ? null : undefined
    }
  });

  await audit(req, userId, AuditAction.APPLICATION_UPDATED, { entity: "JobApplication", entityId: updated.id });

  return NextResponse.json({ item: updated });
}

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const { id } = await ctx.params;
  const existing = await prisma.jobApplication.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true }
  });
  if (!existing) return jsonError(404, "NOT_FOUND", "Application not found");

  await prisma.jobApplication.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  await audit(_req, userId, AuditAction.APPLICATION_DELETED, { entity: "JobApplication", entityId: id });

  return NextResponse.json({ ok: true });
}
