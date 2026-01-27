import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/auth";
import { jsonError, zodToDetails } from "@/lib/errors";
import { z } from "zod";
import { contactCreateSchema, contactUpdateSchema } from "@/lib/validators/contacts";
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit";

const listQuerySchema = z.object({
  applicationId: z.string().min(1)
});

export async function GET(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const url = new URL(req.url);
  const parsed = listQuerySchema.safeParse({
    applicationId: url.searchParams.get("applicationId") ?? undefined
  });
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "Invalid query", zodToDetails(parsed.error));

  const app = await prisma.jobApplication.findFirst({
    where: { id: parsed.data.applicationId, userId, deletedAt: null },
    select: { id: true }
  });
  if (!app) return jsonError(404, "NOT_FOUND", "Application not found");

  const items = await prisma.contact.findMany({
    where: { userId, applicationId: parsed.data.applicationId, deletedAt: null },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const raw = await req.json().catch(() => null);
  const parsed = contactCreateSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));

  const app = await prisma.jobApplication.findFirst({
    where: { id: parsed.data.applicationId, userId, deletedAt: null },
    select: { id: true }
  });
  if (!app) return jsonError(404, "NOT_FOUND", "Application not found");

  const created = await prisma.contact.create({
    data: {
      userId,
      applicationId: parsed.data.applicationId,
      name: parsed.data.name,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      role: parsed.data.role ?? null,
      company: parsed.data.company ?? null
    }
  });

  await audit(req, userId, AuditAction.CONTACT_CREATED, { entity: "Contact", entityId: created.id });

  return NextResponse.json({ item: created }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return jsonError(400, "BAD_REQUEST", "Missing contact id");

  const raw = await req.json().catch(() => null);
  const parsed = contactUpdateSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));

  const existing = await prisma.contact.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true }
  });
  if (!existing) return jsonError(404, "NOT_FOUND", "Contact not found");

  const updated = await prisma.contact.update({
    where: { id },
    data: parsed.data
  });

  await audit(req, userId, AuditAction.CONTACT_UPDATED, { entity: "Contact", entityId: updated.id });

  return NextResponse.json({ item: updated });
}

export async function DELETE(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return jsonError(400, "BAD_REQUEST", "Missing contact id");

  const existing = await prisma.contact.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true }
  });
  if (!existing) return jsonError(404, "NOT_FOUND", "Contact not found");

  await prisma.contact.update({
    where: { id },
    data: { deletedAt: new Date() }
  });

  await audit(req, userId, AuditAction.CONTACT_DELETED, { entity: "Contact", entityId: id });

  return NextResponse.json({ ok: true });
}
