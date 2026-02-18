import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireUserOr401 } from "@/lib/auth";
import { jsonError, zodToDetails } from "@/lib/errors";
import { z } from "zod";
import { enforceRateLimitAsync } from "@/lib/rateLimit";
import { audit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";

// Schema allows currentPassword to be optional for OAuth-only users setting a password
const schema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(72) // bcrypt truncates at 72 bytes
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

  // If user has a password, require current password to change it
  if (user.passwordHash) {
    if (!parsed.data.currentPassword) {
      return jsonError(400, "VALIDATION_ERROR", "Current password is required");
    }
    const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!ok) return jsonError(400, "INVALID_CREDENTIALS", "Current password is incorrect.");
  }
  // If user has no password (OAuth-only), they can set one without providing current password

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  await audit(req, userId, AuditAction.AUTH_PASSWORD_RESET, { 
    meta: { via: user.passwordHash ? "change_password" : "set_password" } 
  });

  return NextResponse.json({ ok: true });
}
