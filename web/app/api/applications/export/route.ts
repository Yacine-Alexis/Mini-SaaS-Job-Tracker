import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserWithPlanOr401 } from "@/lib/auth";
import { jsonError, zodToDetails } from "@/lib/errors";
import { applicationListQuerySchema } from "@/lib/validators/applications";
import { isPro } from "@/lib/plan";
import { audit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";


function csvEscape(value: unknown) {
  const s = value == null ? "" : String(value);
  const needs = /[",\n\r]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needs ? `"${escaped}"` : escaped;
}

export async function GET(req: NextRequest) {
  // Plan is cached in JWT - no DB query needed
  const { userId, plan, error } = await requireUserWithPlanOr401();
  if (error) return error;

  // Pro-only feature
  if (!isPro(plan)) {
    return jsonError(403, "PLAN_REQUIRED", "Upgrade to Pro to export CSV.");
  }

  const url = new URL(req.url);

  const qParsed = applicationListQuerySchema.safeParse({
    stage: url.searchParams.get("stage") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    tags: url.searchParams.get("tags") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined
  });
  if (!qParsed.success) return jsonError(400, "VALIDATION_ERROR", "Invalid filters", zodToDetails(qParsed.error));

  const { stage, q, tags, from, to } = qParsed.data;
  const tagList = tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];

  const where: any = { userId, deletedAt: null };
  if (stage) where.stage = stage;

  if (q) {
    where.OR = [
      { company: { contains: q, mode: "insensitive" } },
      { title: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } }
    ];
  }

  if (tagList.length) where.tags = { hasSome: tagList };

  if (from || to) {
    where.appliedDate = {};
    if (from) where.appliedDate.gte = new Date(from);
    if (to) where.appliedDate.lte = new Date(to);
  }

  const items = await prisma.jobApplication.findMany({
    where,
    orderBy: { updatedAt: "desc" }
  });

  const header = [
    "company",
    "title",
    "stage",
    "location",
    "url",
    "salaryMin",
    "salaryMax",
    "appliedDate",
    "source",
    "tags",
    "createdAt",
    "updatedAt"
  ].join(",");

  const rows = items.map((it) => [
    csvEscape(it.company),
    csvEscape(it.title),
    csvEscape(it.stage),
    csvEscape(it.location),
    csvEscape(it.url),
    csvEscape(it.salaryMin),
    csvEscape(it.salaryMax),
    csvEscape(it.appliedDate ? it.appliedDate.toISOString() : ""),
    csvEscape(it.source),
    csvEscape((it.tags ?? []).join("|")),
    csvEscape(it.createdAt.toISOString()),
    csvEscape(it.updatedAt.toISOString())
  ].join(","));

  const csv = [header, ...rows].join("\n");

  // Log the export
  await audit(req, userId, AuditAction.EXPORT_CSV);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="applications.csv"`
    }
  });
}
