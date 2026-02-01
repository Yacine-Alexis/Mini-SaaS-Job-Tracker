import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/auth";
import { jsonError, zodToDetails } from "@/lib/errors";
import { z } from "zod";
import { enforceRateLimitAsync } from "@/lib/rateLimit";
import { audit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(200)
});

export async function POST(req: NextRequest) {
  const rl = await enforceRateLimitAsync(req, "account:change-password", 5, 60_000);
  if (rl) return rl;

  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const raw = await req.json().catch(() => null);
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return jsonError(404, "NOT_FOUND", "User not found");
  if (!user.passwordHash) return jsonError(400, "BAD_REQUEST", "Password auth not enabled for this account.");

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return jsonError(400, "INVALID_CREDENTIALS", "Current password is incorrect.");

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  await audit(req, userId, AuditAction.AUTH_PASSWORD_RESET, { meta: { via: "change_password" } });

  return NextResponse.json({ ok: true });
}
