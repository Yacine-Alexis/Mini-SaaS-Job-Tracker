import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, zodToDetails } from "@/lib/errors";
import { requireUserOr401 } from "@/lib/auth";
import { applicationCreateSchema, applicationListQuerySchema } from "@/lib/validators/applications";
import { paginationQuerySchema, toSkipTake } from "@/lib/pagination";
import { getUserPlan, isPro, LIMITS } from "@/lib/plan";
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const url = new URL(req.url);

  const pParsed = paginationQuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined
  });
  if (!pParsed.success) return jsonError(400, "VALIDATION_ERROR", "Invalid pagination", zodToDetails(pParsed.error));

  const qParsed = applicationListQuerySchema.safeParse({
    stage: url.searchParams.get("stage") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    tags: url.searchParams.get("tags") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined
  });
  if (!qParsed.success) return jsonError(400, "VALIDATION_ERROR", "Invalid filters", zodToDetails(qParsed.error));

  const { skip, take } = toSkipTake(pParsed.data);
  const { stage, q, tags, from, to } = qParsed.data;

  const tagList =
    tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];

  const where: any = {
    userId,
    deletedAt: null
  };

  if (stage) where.stage = stage;

  if (q) {
    where.OR = [
      { company: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } }
    ];
  }

  if (tagList.length) {
    // match ANY of the tags
    where.tags = { hasSome: tagList };
  }

  if (from || to) {
    where.appliedDate = {};
    if (from) where.appliedDate.gte = new Date(from);
    if (to) where.appliedDate.lte = new Date(to);
  }

  const [total, items] = await Promise.all([
    prisma.jobApplication.count({ where }),
    prisma.jobApplication.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take
    })
  ]);

  return NextResponse.json({
    page: pParsed.data.page,
    pageSize: pParsed.data.pageSize,
    total,
    items
  });
}

export async function POST(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const plan = await getUserPlan(userId);
  if (!isPro(plan)) {
    const count = await prisma.jobApplication.count({ where: { userId, deletedAt: null } });
    if (count >= LIMITS.FREE_MAX_APPLICATIONS) {
      return jsonError(403, "PLAN_LIMIT", `Free plan limit reached (${LIMITS.FREE_MAX_APPLICATIONS}). Upgrade to Pro.`);
    }
  }

  const raw = await req.json().catch(() => null);
  const parsed = applicationCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));
  }

  const created = await prisma.jobApplication.create({
    data: {
      userId,
      company: parsed.data.company,
      title: parsed.data.title,
      location: parsed.data.location ?? null,
      url: parsed.data.url ?? null,
      salaryMin: parsed.data.salaryMin ?? null,
      salaryMax: parsed.data.salaryMax ?? null,
      stage: parsed.data.stage ?? undefined,
      appliedDate: parsed.data.appliedDate ? new Date(parsed.data.appliedDate) : null,
      source: parsed.data.source ?? null,
      tags: parsed.data.tags ?? []
    }
  });

  await audit(req, userId, AuditAction.APPLICATION_CREATED, { entity: "JobApplication", entityId: created.id });

  return NextResponse.json({ item: created }, { status: 201 });
}
