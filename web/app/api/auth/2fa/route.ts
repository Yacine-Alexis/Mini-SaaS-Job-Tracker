/**
 * Two-Factor Authentication API endpoints.
 * 
 * GET /api/auth/2fa - Get 2FA status
 * POST /api/auth/2fa/setup - Generate setup (secret + QR code)
 * POST /api/auth/2fa/enable - Enable 2FA after verification
 * POST /api/auth/2fa/disable - Disable 2FA
 * POST /api/auth/2fa/verify - Verify 2FA code during login
 * POST /api/auth/2fa/backup - Regenerate backup codes
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";
import {
  generate2FASetup,
  enable2FA,
  disable2FA,
  has2FAEnabled,
  getBackupCodesCount,
  regenerateBackupCodes,
} from "@/lib/twoFactor";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/errors";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";

// Store pending setups in memory (cleared on server restart)
// In production, use Redis or database
const pendingSetups = new Map<string, { secret: string; backupCodes: string[]; expiresAt: number }>();

// Cleanup old pending setups periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, setup] of pendingSetups.entries()) {
    if (now > setup.expiresAt) {
      pendingSetups.delete(key);
    }
  }
}, 60000);

/**
 * GET /api/auth/2fa - Get 2FA status
 */
export async function GET() {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const enabled = await has2FAEnabled(userId);
  const backupCodesCount = enabled ? await getBackupCodesCount(userId) : 0;

  return NextResponse.json({
    enabled,
    backupCodesCount,
  });
}

/**
 * POST /api/auth/2fa - Handle 2FA actions
 */
export async function POST(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const action = body.action as string;

  switch (action) {
    case "setup":
      return handleSetup(userId);
    case "enable":
      return handleEnable(req, userId, body);
    case "disable":
      return handleDisable(req, userId, body);
    case "regenerate-backup":
      return handleRegenerateBackup(req, userId, body);
    default:
      return jsonError(400, "INVALID_ACTION", "Invalid action");
  }
}

async function handleSetup(userId: string) {
  // Check if 2FA is already enabled
  const enabled = await has2FAEnabled(userId);
  if (enabled) {
    return jsonError(400, "ALREADY_ENABLED", "2FA is already enabled");
  }

  // Get user email
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    return jsonError(404, "USER_NOT_FOUND", "User not found");
  }

  // Generate setup
  const { secret, qrCodeDataUrl, backupCodes } = await generate2FASetup(userId, user.email);

  // Store pending setup (expires in 10 minutes)
  pendingSetups.set(userId, {
    secret,
    backupCodes,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  return NextResponse.json({
    qrCodeDataUrl,
    backupCodes,
    // Don't send secret to client - it's stored server-side
  });
}

const enableSchema = z.object({
  action: z.literal("enable"),
  code: z.string().length(6, "Code must be 6 digits"),
});

async function handleEnable(req: NextRequest, userId: string, body: unknown) {
  const parsed = enableSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid code format");
  }

  const pendingSetup = pendingSetups.get(userId);
  if (!pendingSetup || Date.now() > pendingSetup.expiresAt) {
    pendingSetups.delete(userId);
    return jsonError(400, "SETUP_EXPIRED", "Setup expired. Please start again.");
  }

  const result = await enable2FA(userId, pendingSetup.secret, parsed.data.code, pendingSetup.backupCodes);
  
  if (!result.success) {
    return jsonError(400, "INVALID_CODE", result.error || "Invalid verification code");
  }

  // Clear pending setup
  pendingSetups.delete(userId);

  await audit(req, userId, AuditAction.AUTH_LOGIN, {
    action: "2fa_enabled",
  });

  return NextResponse.json({ success: true, message: "2FA enabled successfully" });
}

const disableSchema = z.object({
  action: z.literal("disable"),
  code: z.string().min(6, "Code required"),
});

async function handleDisable(req: NextRequest, userId: string, body: unknown) {
  const parsed = disableSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid code format");
  }

  // Verify the code first
  const { verify2FALogin } = await import("@/lib/twoFactor");
  const verification = await verify2FALogin(userId, parsed.data.code);
  
  if (!verification.success) {
    return jsonError(400, "INVALID_CODE", "Invalid verification code");
  }

  await disable2FA(userId);

  await audit(req, userId, AuditAction.AUTH_LOGOUT, {
    action: "2fa_disabled",
  });

  return NextResponse.json({ success: true, message: "2FA disabled successfully" });
}

const regenerateSchema = z.object({
  action: z.literal("regenerate-backup"),
  code: z.string().min(6, "Code required"),
});

async function handleRegenerateBackup(req: NextRequest, userId: string, body: unknown) {
  const parsed = regenerateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid code format");
  }

  // Verify the code first
  const { verify2FALogin } = await import("@/lib/twoFactor");
  const verification = await verify2FALogin(userId, parsed.data.code);
  
  if (!verification.success) {
    return jsonError(400, "INVALID_CODE", "Invalid verification code");
  }

  const backupCodes = await regenerateBackupCodes(userId);

  await audit(req, userId, AuditAction.AUTH_LOGIN, {
    action: "2fa_backup_codes_regenerated",
  });

  return NextResponse.json({
    success: true,
    backupCodes,
    message: "Backup codes regenerated. Save them securely.",
  });
}
