/**
 * Custom login endpoint with throttling and 2FA support.
 * This endpoint validates credentials and checks throttling before forwarding to NextAuth.
 * 
 * POST /api/auth/login
 * Body: { email: string, password: string, twoFactorCode?: string }
 * Returns: { success: boolean, requires2FA?: boolean, error?: string, remainingAttempts?: number }
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getClientIp } from "@/lib/rateLimit";
import {
  getAttemptKey,
  checkLoginAllowed,
  recordFailedAttempt,
  clearLoginAttempts,
  formatLockoutDuration,
} from "@/lib/loginThrottle";
import { has2FAEnabled, verify2FALogin } from "@/lib/twoFactor";
import { z } from "zod";
import { jsonError, zodToDetails } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
  twoFactorCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = loginSchema.safeParse(body);
  
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();
  const clientIp = getClientIp(req);
  const attemptKey = getAttemptKey(clientIp, normalizedEmail);

  // Check if login is throttled
  const throttleStatus = checkLoginAllowed(attemptKey);
  
  if (!throttleStatus.allowed) {
    const duration = formatLockoutDuration(throttleStatus.retryAfterMs || 60000);
    return jsonError(429, "ACCOUNT_LOCKED", `Too many failed attempts. Try again in ${duration}.`, {
      lockedUntilMs: throttleStatus.lockedUntilMs,
      retryAfterMs: throttleStatus.retryAfterMs,
    });
  }

  // Find user
  const user = await prisma.user.findFirst({
    where: { email: normalizedEmail, deletedAt: null },
    select: { id: true, email: true, passwordHash: true, plan: true }
  });

  if (!user) {
    // Record failed attempt (user not found)
    const result = recordFailedAttempt(attemptKey, clientIp, normalizedEmail);
    
    if (result.locked) {
      const duration = formatLockoutDuration(result.lockoutDurationMs || 60000);
      return jsonError(429, "ACCOUNT_LOCKED", `Too many failed attempts. Account locked for ${duration}.`, {
        lockedUntilMs: result.lockedUntilMs,
      });
    }

    // Generic error to prevent user enumeration
    return jsonError(401, "INVALID_CREDENTIALS", "Invalid email or password", {
      remainingAttempts: result.remainingAttempts,
    });
  }

  // Verify password
  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  
  if (!passwordValid) {
    // Record failed attempt (wrong password)
    const result = recordFailedAttempt(attemptKey, clientIp, normalizedEmail);
    
    if (result.locked) {
      const duration = formatLockoutDuration(result.lockoutDurationMs || 60000);
      return jsonError(429, "ACCOUNT_LOCKED", `Too many failed attempts. Account locked for ${duration}.`, {
        lockedUntilMs: result.lockedUntilMs,
      });
    }

    return jsonError(401, "INVALID_CREDENTIALS", "Invalid email or password", {
      remainingAttempts: result.remainingAttempts,
    });
  }

  // Check if 2FA is enabled
  const twoFactorEnabled = await has2FAEnabled(user.id);
  
  if (twoFactorEnabled) {
    const { twoFactorCode } = parsed.data;
    
    // If no 2FA code provided, tell client to prompt for it
    if (!twoFactorCode) {
      return NextResponse.json({
        success: false,
        requires2FA: true,
        message: "Two-factor authentication required",
      });
    }

    // Verify 2FA code
    const twoFactorResult = await verify2FALogin(user.id, twoFactorCode);
    
    if (!twoFactorResult.success) {
      // Record as failed attempt (wrong 2FA code)
      const result = recordFailedAttempt(attemptKey, clientIp, normalizedEmail);
      
      return jsonError(401, "INVALID_2FA_CODE", "Invalid two-factor authentication code", {
        remainingAttempts: result.remainingAttempts,
      });
    }

    // Warn if backup code was used
    if (twoFactorResult.usedBackupCode) {
      // Still allow login, but note it in audit
      await audit(req, user.id, AuditAction.AUTH_LOGIN, {
        ip: clientIp,
        email: normalizedEmail,
        usedBackupCode: true,
      });
    }
  }

  // Successful login - clear attempts
  clearLoginAttempts(attemptKey);

  // Audit successful login
  await audit(req, user.id, AuditAction.AUTH_LOGIN, {
    ip: clientIp,
    email: normalizedEmail,
    twoFactorUsed: twoFactorEnabled,
  });

  // Return success with user info for client-side signIn
  return NextResponse.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      plan: user.plan,
    },
    // Client should call signIn("credentials") with these validated credentials
    validated: true,
  });
}
