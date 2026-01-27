import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { zodToDetails, jsonError } from "@/lib/errors";
import { resetPasswordSchema } from "@/lib/validators/passwordReset";
import { enforceRateLimit } from "@/lib/rateLimit";
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit";

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export async function POST(req: NextRequest) {
  const rl = enforceRateLimit(req, "auth:reset", 5, 60_000);
  if (rl) return rl;

  const raw = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));

  const tokenHash = sha256(parsed.data.token);
  const now = new Date();

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!record || record.usedAt || record.expiresAt <= now) {
    return jsonError(400, "INVALID_TOKEN", "This reset link is invalid or expired.");
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash }
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: now }
    })
  ]);

  await audit(req, record.userId, AuditAction.AUTH_PASSWORD_RESET, { meta: { via: "reset_token" } });

  // If you use DB sessions, you could also invalidate sessions here.
  return NextResponse.json({ ok: true });
}
