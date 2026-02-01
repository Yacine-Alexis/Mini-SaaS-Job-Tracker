import { NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, zodToDetails } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";
import {
  documentCreateSchema,
  documentUpdateSchema,
  documentListQuerySchema,
} from "@/lib/validators/documents";

// GET /api/documents - List user's documents
export async function GET(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const url = new URL(req.url);
  const parsed = documentListQuerySchema.safeParse({
    type: url.searchParams.get("type") || undefined,
    applicationId: url.searchParams.get("applicationId") || undefined,
  });

  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid query params", zodToDetails(parsed.error));
  }

  const { type, applicationId } = parsed.data;

  const documents = await prisma.document.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(type && { type }),
      ...(applicationId && { applicationId }),
    },
    include: {
      application: {
        select: {
          id: true,
          company: true,
          title: true,
        },
      },
    },
    orderBy: [
      { type: "asc" },
      { isDefault: "desc" },
      { updatedAt: "desc" },
    ],
  });

  return NextResponse.json({ items: documents });
}

// POST /api/documents - Create a new document
export async function POST(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const raw = await req.json().catch(() => null);
  const parsed = documentCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid document data", zodToDetails(parsed.error));
  }

  const data = parsed.data;

  // If setting as default, unset other defaults of same type
  if (data.isDefault) {
    await prisma.document.updateMany({
      where: {
        userId,
        type: data.type,
        deletedAt: null,
      },
      data: { isDefault: false },
    });
  }

  // Verify applicationId belongs to user if provided
  if (data.applicationId) {
    const app = await prisma.jobApplication.findFirst({
      where: { id: data.applicationId, userId, deletedAt: null },
    });
    if (!app) {
      return jsonError(400, "BAD_REQUEST", "Application not found");
    }
  }

  const document = await prisma.document.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      fileName: data.fileName,
      fileUrl: data.fileUrl ?? null,
      fileContent: data.fileContent ?? null,
      version: data.version ?? null,
      applicationId: data.applicationId ?? null,
      isDefault: data.isDefault,
    },
    include: {
      application: {
        select: { id: true, company: true, title: true },
      },
    },
  });

  await audit(req, userId, AuditAction.DOCUMENT_CREATED, {
    entity: "Document",
    entityId: document.id,
  });

  return NextResponse.json({ item: document }, { status: 201 });
}

// PATCH /api/documents - Update a document
export async function PATCH(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const raw = await req.json().catch(() => null);
  const parsed = documentUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid document data", zodToDetails(parsed.error));
  }

  const { id, ...updates } = parsed.data;

  // Verify document belongs to user
  const existing = await prisma.document.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) {
    return jsonError(404, "NOT_FOUND", "Document not found");
  }

  // If setting as default, unset other defaults of same type
  const newType = updates.type ?? existing.type;
  if (updates.isDefault) {
    await prisma.document.updateMany({
      where: {
        userId,
        type: newType,
        id: { not: id },
        deletedAt: null,
      },
      data: { isDefault: false },
    });
  }

  // Verify applicationId belongs to user if provided
  if (updates.applicationId) {
    const app = await prisma.jobApplication.findFirst({
      where: { id: updates.applicationId, userId, deletedAt: null },
    });
    if (!app) {
      return jsonError(400, "BAD_REQUEST", "Application not found");
    }
  }

  const document = await prisma.document.update({
    where: { id },
    data: {
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.type !== undefined && { type: updates.type }),
      ...(updates.fileName !== undefined && { fileName: updates.fileName }),
      ...(updates.fileUrl !== undefined && { fileUrl: updates.fileUrl }),
      ...(updates.fileContent !== undefined && { fileContent: updates.fileContent }),
      ...(updates.version !== undefined && { version: updates.version }),
      ...(updates.applicationId !== undefined && { applicationId: updates.applicationId }),
      ...(updates.isDefault !== undefined && { isDefault: updates.isDefault }),
    },
    include: {
      application: {
        select: { id: true, company: true, title: true },
      },
    },
  });

  await audit(req, userId, AuditAction.DOCUMENT_UPDATED, {
    entity: "Document",
    entityId: document.id,
  });

  return NextResponse.json({ item: document });
}

// DELETE /api/documents - Soft delete a document
export async function DELETE(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return jsonError(400, "BAD_REQUEST", "Document ID is required");
  }

  // Verify document belongs to user
  const existing = await prisma.document.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) {
    return jsonError(404, "NOT_FOUND", "Document not found");
  }

  await prisma.document.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await audit(req, userId, AuditAction.DOCUMENT_DELETED, {
    entity: "Document",
    entityId: id,
  });

  return NextResponse.json({ success: true });
}
