/**
 * Two-Factor Authentication service using TOTP (Time-based One-Time Password).
 * Implements RFC 6238 compatible 2FA with backup codes.
 * 
 * @module lib/twoFactor
 */

import { authenticator } from "otplib";
import * as QRCode from "qrcode";
import { createHash, randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/** App name shown in authenticator apps */
const APP_NAME = "JobTracker Pro";

/** Number of backup codes to generate */
const BACKUP_CODE_COUNT = 10;

/** Backup code length */
const BACKUP_CODE_LENGTH = 8;

/**
 * Get encryption key from environment (32 bytes for AES-256)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.TWO_FACTOR_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET;
  if (!key) {
    throw new Error("Missing encryption key for 2FA");
  }
  // Hash to get exactly 32 bytes
  return createHash("sha256").update(key).digest();
}

/**
 * Encrypt a secret for storage
 */
export function encryptSecret(secret: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(secret, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypt a stored secret
 */
export function decryptSecret(encrypted: string): string {
  const key = getEncryptionKey();
  const [ivHex, encryptedHex] = encrypted.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Hash a backup code for storage
 */
export function hashBackupCode(code: string): string {
  return createHash("sha256").update(code.toLowerCase().replace(/\s/g, "")).digest("hex");
}

/**
 * Verify a backup code against hashed codes
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): boolean {
  const normalizedCode = code.toLowerCase().replace(/[\s-]/g, "");
  // Re-add dash for hashing (codes are stored as XXXX-XXXX)
  const formattedCode = normalizedCode.slice(0, 4) + "-" + normalizedCode.slice(4);
  const hash = hashBackupCode(formattedCode);
  return hashedCodes.includes(hash);
}

/**
 * Generate a random backup code
 */
function generateBackupCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude similar chars
  let code = "";
  const bytes = randomBytes(BACKUP_CODE_LENGTH);
  for (let i = 0; i < BACKUP_CODE_LENGTH; i++) {
    code += chars[bytes[i] % chars.length];
  }
  // Format as XXXX-XXXX
  return code.slice(0, 4) + "-" + code.slice(4);
}

/**
 * Generate multiple backup codes
 */
export function generateBackupCodes(count: number = BACKUP_CODE_COUNT): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(generateBackupCode());
  }
  return codes;
}

/**
 * Generate a new TOTP secret
 */
export function generateSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Generate QR code data URL for authenticator setup
 */
export async function generateQRCodeDataURL(secret: string, email: string): Promise<string> {
  const otpAuthUrl = authenticator.keyuri(email, APP_NAME, secret);
  return QRCode.toDataURL(otpAuthUrl, {
    width: 200,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}

/**
 * Verify a TOTP code
 */
export function verifyTOTP(secret: string, code: string): boolean {
  try {
    // Allow 1 window before and after for clock drift
    return authenticator.verify({ token: code, secret });
  } catch {
    return false;
  }
}

/**
 * Generate setup data for enabling 2FA
 * Returns secret and QR code data URL
 */
export async function generate2FASetup(userId: string, email: string): Promise<{
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}> {
  // Generate new secret
  const secret = generateSecret();
  
  // Generate QR code as data URL
  const qrCodeDataUrl = await generateQRCodeDataURL(secret, email);

  // Generate backup codes
  const backupCodes = generateBackupCodes();

  logger.info("2FA setup generated", {
    requestId: `2fa-setup-${Date.now()}`,
    userId,
  });

  return { secret, qrCodeDataUrl, backupCodes };
}

/**
 * Verify a TOTP code - alias for verifyTOTP
 */
export const verifyTOTPCode = verifyTOTP;

/**
 * Enable 2FA for a user after verification
 */
export async function enable2FA(
  userId: string,
  secret: string,
  code: string,
  backupCodes: string[]
): Promise<{ success: boolean; error?: string }> {
  // Verify the code first
  if (!verifyTOTPCode(secret, code)) {
    return { success: false, error: "Invalid verification code" };
  }

  // Encrypt secret and hash backup codes
  const encryptedSecret = encryptSecret(secret);
  const hashedBackupCodes = backupCodes.map(hashBackupCode);

  // Update user
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: encryptedSecret,
      twoFactorBackupCodes: hashedBackupCodes,
    },
  });

  logger.info("2FA enabled", {
    requestId: `2fa-enable-${Date.now()}`,
    userId,
  });

  return { success: true };
}

/**
 * Disable 2FA for a user
 */
export async function disable2FA(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
    },
  });

  logger.info("2FA disabled", {
    requestId: `2fa-disable-${Date.now()}`,
    userId,
  });
}

/**
 * Verify 2FA code during login (TOTP or backup code)
 */
export async function verify2FALogin(
  userId: string,
  code: string
): Promise<{ success: boolean; usedBackupCode: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      twoFactorEnabled: true,
      twoFactorSecret: true,
      twoFactorBackupCodes: true,
    },
  });

  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return { success: false, usedBackupCode: false };
  }

  // Try TOTP first
  const secret = decryptSecret(user.twoFactorSecret);
  if (verifyTOTPCode(secret, code)) {
    return { success: true, usedBackupCode: false };
  }

  // Try backup codes
  const hashedCode = hashBackupCode(code);
  const backupCodeIndex = user.twoFactorBackupCodes.indexOf(hashedCode);
  
  if (backupCodeIndex !== -1) {
    // Remove used backup code
    const updatedCodes = [...user.twoFactorBackupCodes];
    updatedCodes.splice(backupCodeIndex, 1);
    
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorBackupCodes: updatedCodes },
    });

    logger.warn("Backup code used for 2FA", {
      requestId: `2fa-backup-${Date.now()}`,
      userId,
      remainingCodes: updatedCodes.length,
    });

    return { success: true, usedBackupCode: true };
  }

  return { success: false, usedBackupCode: false };
}

/**
 * Check if a user has 2FA enabled
 */
export async function has2FAEnabled(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  });
  return user?.twoFactorEnabled ?? false;
}

/**
 * Get remaining backup codes count
 */
export async function getBackupCodesCount(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorBackupCodes: true },
  });
  return user?.twoFactorBackupCodes.length ?? 0;
}

/**
 * Regenerate backup codes
 */
export async function regenerateBackupCodes(userId: string): Promise<string[]> {
  const backupCodes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    backupCodes.push(generateBackupCode());
  }

  const hashedCodes = backupCodes.map(hashBackupCode);

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorBackupCodes: hashedCodes },
  });

  logger.info("Backup codes regenerated", {
    requestId: `2fa-regenerate-${Date.now()}`,
    userId,
  });

  return backupCodes;
}
