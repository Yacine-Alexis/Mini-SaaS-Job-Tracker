import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/auth";
import { jsonError } from "@/lib/errors";
import { enforceRateLimitAsync } from "@/lib/rateLimit";
import { audit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";

export async function POST(req: NextRequest) {
  const rl = await enforceRateLimitAsync(req, "account:delete", 2, 60_000);
  if (rl) return rl;

  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return jsonError(404, "NOT_FOUND", "User not found");

  await audit(req, userId, AuditAction.AUTH_LOGOUT, { meta: { reason: "account_deleted" } });

  // NOTE: in a real app, also revoke Stripe subscription, etc.
  // Soft delete to preserve audit trail and comply with data retention policies
  await prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date() } });

  return NextResponse.json({ ok: true });
}
