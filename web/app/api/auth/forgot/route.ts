import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { zodToDetails, jsonError } from "@/lib/errors";
import { forgotPasswordSchema } from "@/lib/validators/passwordReset";
import { sendPasswordResetEmail } from "@/lib/email";
import { enforceRateLimitAsync } from "@/lib/rateLimit";

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

export async function POST(req: NextRequest) {
  const rl = await enforceRateLimitAsync(req, "auth:forgot", 5, 60_000);
  if (rl) return rl;

  const raw = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));

  const email = parsed.data.email.toLowerCase();

  // Always respond ok (no enumeration)
  // IMPORTANT: Check deletedAt to prevent sending reset emails to soft-deleted users
  const user = await prisma.user.findFirst({ where: { email, deletedAt: null } }).catch(() => null);
  if (!user) return NextResponse.json({ ok: true });

  // Token + hashed storage
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt }
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

  await sendPasswordResetEmail({ to: email, resetUrl });

  return NextResponse.json({ ok: true });
}
