import { NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, zodToDetails } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";
import { labelCreateSchema, labelUpdateSchema } from "@/lib/validators/labels";

// GET /api/labels - List user's labels
export async function GET(_req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const labels = await prisma.label.findMany({
    where: {
      userId,
      deletedAt: null,
    },
    orderBy: [
      { name: "asc" },
    ],
  });

  return NextResponse.json({ items: labels });
}

// POST /api/labels - Create a new label
export async function POST(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const raw = await req.json().catch(() => null);
  const parsed = labelCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid label data", zodToDetails(parsed.error));
  }

  const { name, color } = parsed.data;

  // Check for duplicate name
  const existing = await prisma.label.findFirst({
    where: {
      userId,
      name: { equals: name, mode: "insensitive" },
      deletedAt: null,
    },
  });
  if (existing) {
    return jsonError(409, "DUPLICATE", "A label with this name already exists");
  }

  const label = await prisma.label.create({
    data: {
      userId,
      name,
      color,
    },
  });

  await audit(req, userId, AuditAction.LABEL_CREATED, {
    entity: "Label",
    entityId: label.id,
  });

  return NextResponse.json({ item: label }, { status: 201 });
}

// PATCH /api/labels - Update a label
export async function PATCH(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const raw = await req.json().catch(() => null);
  const parsed = labelUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid label data", zodToDetails(parsed.error));
  }

  const { id, name, color } = parsed.data;

  // Verify label belongs to user
  const existing = await prisma.label.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) {
    return jsonError(404, "NOT_FOUND", "Label not found");
  }

  // Check for duplicate name if changing
  if (name && name.toLowerCase() !== existing.name.toLowerCase()) {
    const duplicate = await prisma.label.findFirst({
      where: {
        userId,
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
        id: { not: id },
      },
    });
    if (duplicate) {
      return jsonError(409, "DUPLICATE", "A label with this name already exists");
    }
  }

  const label = await prisma.label.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(color !== undefined && { color }),
    },
  });

  await audit(req, userId, AuditAction.LABEL_UPDATED, {
    entity: "Label",
    entityId: label.id,
  });

  return NextResponse.json({ item: label });
}

// DELETE /api/labels - Soft delete a label
export async function DELETE(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return jsonError(400, "BAD_REQUEST", "Label ID is required");
  }

  // Verify label belongs to user
  const existing = await prisma.label.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) {
    return jsonError(404, "NOT_FOUND", "Label not found");
  }

  await prisma.label.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await audit(req, userId, AuditAction.LABEL_DELETED, {
    entity: "Label",
    entityId: id,
  });

  return NextResponse.json({ success: true });
}
