import { NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError, zodToDetails } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";
import {
  salaryOfferCreateSchema,
  salaryOfferUpdateSchema,
} from "@/lib/validators/salaryOffers";

// GET /api/salary-offers - List user's salary offers
export async function GET(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const url = new URL(req.url);
  const applicationId = url.searchParams.get("applicationId");

  const offers = await prisma.salaryOffer.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(applicationId && { applicationId }),
    },
    include: {
      application: {
        select: {
          id: true,
          company: true,
          title: true,
          stage: true,
        },
      },
    },
    orderBy: [
      { offerDate: "desc" },
    ],
  });

  return NextResponse.json({ items: offers });
}

// POST /api/salary-offers - Create a new salary offer
export async function POST(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const raw = await req.json().catch(() => null);
  const parsed = salaryOfferCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid offer data", zodToDetails(parsed.error));
  }

  const data = parsed.data;

  // Verify applicationId belongs to user
  const app = await prisma.jobApplication.findFirst({
    where: { id: data.applicationId, userId, deletedAt: null },
  });
  if (!app) {
    return jsonError(400, "BAD_REQUEST", "Application not found");
  }

  const offer = await prisma.salaryOffer.create({
    data: {
      userId,
      applicationId: data.applicationId,
      type: data.type,
      baseSalary: data.baseSalary,
      bonus: data.bonus ?? null,
      equity: data.equity ?? null,
      signingBonus: data.signingBonus ?? null,
      benefits: data.benefits ?? null,
      notes: data.notes ?? null,
      offerDate: data.offerDate ? new Date(data.offerDate) : new Date(),
      isAccepted: data.isAccepted ?? null,
      currency: data.currency,
    },
    include: {
      application: {
        select: { id: true, company: true, title: true, stage: true },
      },
    },
  });

  await audit(req, userId, AuditAction.OFFER_CREATED, {
    entity: "SalaryOffer",
    entityId: offer.id,
  });

  return NextResponse.json({ item: offer }, { status: 201 });
}

// PATCH /api/salary-offers - Update a salary offer
export async function PATCH(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const raw = await req.json().catch(() => null);
  const parsed = salaryOfferUpdateSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid offer data", zodToDetails(parsed.error));
  }

  const { id, ...updates } = parsed.data;

  // Verify offer belongs to user
  const existing = await prisma.salaryOffer.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) {
    return jsonError(404, "NOT_FOUND", "Offer not found");
  }

  const offer = await prisma.salaryOffer.update({
    where: { id },
    data: {
      ...(updates.type !== undefined && { type: updates.type }),
      ...(updates.baseSalary !== undefined && { baseSalary: updates.baseSalary }),
      ...(updates.bonus !== undefined && { bonus: updates.bonus }),
      ...(updates.equity !== undefined && { equity: updates.equity }),
      ...(updates.signingBonus !== undefined && { signingBonus: updates.signingBonus }),
      ...(updates.benefits !== undefined && { benefits: updates.benefits }),
      ...(updates.notes !== undefined && { notes: updates.notes }),
      ...(updates.offerDate !== undefined && { offerDate: new Date(updates.offerDate) }),
      ...(updates.isAccepted !== undefined && { isAccepted: updates.isAccepted }),
      ...(updates.currency !== undefined && { currency: updates.currency }),
    },
    include: {
      application: {
        select: { id: true, company: true, title: true, stage: true },
      },
    },
  });

  await audit(req, userId, AuditAction.OFFER_UPDATED, {
    entity: "SalaryOffer",
    entityId: offer.id,
  });

  return NextResponse.json({ item: offer });
}

// DELETE /api/salary-offers - Soft delete a salary offer
export async function DELETE(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return jsonError(400, "BAD_REQUEST", "Offer ID is required");
  }

  // Verify offer belongs to user
  const existing = await prisma.salaryOffer.findFirst({
    where: { id, userId, deletedAt: null },
  });
  if (!existing) {
    return jsonError(404, "NOT_FOUND", "Offer not found");
  }

  await prisma.salaryOffer.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await audit(req, userId, AuditAction.OFFER_DELETED, {
    entity: "SalaryOffer",
    entityId: id,
  });

  return NextResponse.json({ success: true });
}
