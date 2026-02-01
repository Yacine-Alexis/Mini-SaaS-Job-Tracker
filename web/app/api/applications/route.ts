import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, zodToDetails } from "@/lib/errors";
import { requireUserOr401, requireUserWithPlanOr401 } from "@/lib/auth";
import { applicationCreateSchema, applicationListQuerySchema, validateSalaryRange } from "@/lib/validators/applications";
import { buildApplicationFilter } from "@/lib/validators/shared";
import { paginationQuerySchema, toSkipTake } from "@/lib/pagination";
import { isPro, LIMITS } from "@/lib/plan";
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit";
import { enforceRateLimitAsync } from "@/lib/rateLimit";

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
    to: url.searchParams.get("to") ?? undefined,
    sortBy: url.searchParams.get("sortBy") ?? undefined,
    sortDir: url.searchParams.get("sortDir") ?? undefined
  });
  if (!qParsed.success) return jsonError(400, "VALIDATION_ERROR", "Invalid filters", zodToDetails(qParsed.error));

  const { skip, take } = toSkipTake(pParsed.data);
  const { stage, q, tags, from, to, sortBy, sortDir } = qParsed.data;

  const tagList =
    tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];

  // Use type-safe filter builder
  const where = buildApplicationFilter({
    userId,
    stage,
    q,
    tags: tagList.length > 0 ? tagList : undefined,
    from,
    to
  });

  // Build orderBy from sort parameters (default: updatedAt desc)
  const orderByField = sortBy ?? "updatedAt";
  const orderByDir = sortDir ?? "desc";
  const orderBy = { [orderByField]: orderByDir };

  const [total, items] = await Promise.all([
    prisma.jobApplication.count({ where }),
    prisma.jobApplication.findMany({
      where,
      orderBy,
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
  // Rate limit: 60 creations per minute per IP
  const rl = await enforceRateLimitAsync(req, "applications:create", 60, 60_000);
  if (rl) return rl;

  // Plan is cached in JWT - no DB query needed
  const { userId, plan, error } = await requireUserWithPlanOr401();
  if (error) return error;

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

  const d = parsed.data;

  // Manual salary validation (separated from Zod to preserve types)
  if (!validateSalaryRange(d)) {
    return jsonError(400, "VALIDATION_ERROR", "salaryMin must be <= salaryMax");
  }

  const created = await prisma.jobApplication.create({
    data: {
      userId,
      company: d.company,
      title: d.title,
      location: d.location ?? null,
      url: d.url ?? null,
      salaryMin: d.salaryMin ?? null,
      salaryMax: d.salaryMax ?? null,
      salaryCurrency: d.salaryCurrency ?? null,
      stage: d.stage ?? undefined,
      appliedDate: d.appliedDate ? new Date(d.appliedDate) : null,
      source: d.source ?? null,
      tags: d.tags ?? [],
      // Extended fields
      priority: d.priority ?? undefined,
      remoteType: d.remoteType ?? null,
      jobType: d.jobType ?? null,
      description: d.description ?? null,
      nextFollowUp: d.nextFollowUp ? new Date(d.nextFollowUp) : null,
      rejectionReason: d.rejectionReason ?? null
    }
  });

  await audit(req, userId, AuditAction.APPLICATION_CREATED, { entity: "JobApplication", entityId: created.id });

  return NextResponse.json({ item: created }, { status: 201 });
}
