import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/auth";
import { jsonError, zodToDetails } from "@/lib/errors";
import { importPayloadSchema } from "@/lib/validators/import";
import { getUserPlan, isPro, LIMITS } from "@/lib/plan";
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit";
import { enforceRateLimitAsync } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Rate limit: 5 imports per minute per IP
  const rl = await enforceRateLimitAsync(req, "applications:import", 5, 60_000);
  if (rl) return rl;

  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const raw = await req.json().catch(() => null);
  const parsed = importPayloadSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "Invalid import payload", zodToDetails(parsed.error));

  const plan = await getUserPlan(userId);

  const existingCount = await prisma.jobApplication.count({ where: { userId, deletedAt: null } });
  const maxAllowed = isPro(plan) ? Number.POSITIVE_INFINITY : LIMITS.FREE_MAX_APPLICATIONS;

  const room = Math.max(0, maxAllowed - existingCount);
  if (room <= 0) {
    return jsonError(403, "PLAN_LIMIT", `Free plan limit reached (${LIMITS.FREE_MAX_APPLICATIONS}). Upgrade to Pro.`);
  }

  const toCreate = parsed.data.rows.slice(0, room);

  const createdIds: string[] = [];
  const failures: Array<{ index: number; reason: string }> = [];

  // Create sequentially in a transaction for predictable behavior (MVP)
  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < toCreate.length; i++) {
      const r = toCreate[i];
      try {
        const created = await tx.jobApplication.create({
          data: {
            userId,
            company: r.company,
            title: r.title,
            stage: r.stage ?? "SAVED",
            location: r.location ?? null,
            url: r.url ?? null,
            source: r.source ?? null,
            appliedDate: r.appliedDate ? new Date(r.appliedDate) : null,
            salaryMin: r.salaryMin ?? null,
            salaryMax: r.salaryMax ?? null,
            tags: r.tags ?? []
          }
        });
        createdIds.push(created.id);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "create_failed";
        failures.push({ index: i, reason: message });
      }
    }
  });

  await audit(req, userId, AuditAction.APPLICATION_CREATED, {
    meta: {
      via: "csv_import",
      requested: parsed.data.rows.length,
      accepted: toCreate.length,
      created: createdIds.length,
      failed: failures.length
    }
  });

  // If we truncated due to plan cap:
  const truncated = parsed.data.rows.length > toCreate.length;

  return NextResponse.json({
    ok: true,
    created: createdIds.length,
    truncated,
    failures
  });
}
