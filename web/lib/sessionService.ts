/**
 * Session management service for tracking active user sessions.
 * Handles creation, updates, and cleanup of sessions.
 * 
 * @module lib/sessionService
 */

import { prisma } from "@/lib/db";
import { parseUserAgent } from "@/lib/userAgent";
import { createHash, randomBytes } from "crypto";
import { logger } from "@/lib/logger";

/** Session duration: 30 days */
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

/** How often to update lastActiveAt (5 minutes) */
const ACTIVITY_UPDATE_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Generate a unique session token
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Hash a session token for storage
 */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Create a new session for a user
 */
export async function createSession(params: {
  userId: string;
  userAgent: string | null;
  ip: string;
}): Promise<{ sessionToken: string; sessionId: string }> {
  const { userId, userAgent, ip } = params;
  const parsed = parseUserAgent(userAgent);
  
  const sessionToken = generateSessionToken();
  const hashedToken = hashSessionToken(sessionToken);
  
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  // Mark all other sessions as not current
  await prisma.userSession.updateMany({
    where: { userId, isCurrent: true },
    data: { isCurrent: false },
  });

  const session = await prisma.userSession.create({
    data: {
      userId,
      sessionToken: hashedToken,
      userAgent: userAgent ?? undefined,
      ip,
      deviceType: parsed.deviceType,
      browser: parsed.browser,
      os: parsed.os,
      expiresAt,
      isCurrent: true,
    },
  });

  logger.info("Session created", {
    requestId: `session-create-${Date.now()}`,
    userId,
    sessionId: session.id,
    deviceType: parsed.deviceType,
    browser: parsed.browser,
    os: parsed.os,
  });

  return { sessionToken, sessionId: session.id };
}

/**
 * Validate and update session activity
 * Returns session info if valid, null if invalid/expired/revoked
 */
export async function validateSession(hashedToken: string): Promise<{
  userId: string;
  sessionId: string;
} | null> {
  const session = await prisma.userSession.findUnique({
    where: { sessionToken: hashedToken },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      revokedAt: true,
      lastActiveAt: true,
    },
  });

  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt < new Date()) return null;

  // Update lastActiveAt if stale (to avoid too many writes)
  const timeSinceActive = Date.now() - session.lastActiveAt.getTime();
  if (timeSinceActive > ACTIVITY_UPDATE_INTERVAL_MS) {
    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    }).catch(() => {
      // Non-critical, ignore errors
    });
  }

  return { userId: session.userId, sessionId: session.id };
}

/**
 * Revoke a session by token
 */
export async function revokeSession(hashedToken: string): Promise<boolean> {
  try {
    await prisma.userSession.update({
      where: { sessionToken: hashedToken },
      data: { revokedAt: new Date() },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Revoke all sessions for a user (e.g., on password change)
 */
export async function revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<number> {
  const where: Parameters<typeof prisma.userSession.updateMany>[0]["where"] = {
    userId,
    revokedAt: null,
  };

  if (exceptSessionId) {
    where.id = { not: exceptSessionId };
  }

  const result = await prisma.userSession.updateMany({
    where,
    data: { revokedAt: new Date() },
  });

  logger.info("Revoked all user sessions", {
    requestId: `session-revoke-all-${Date.now()}`,
    userId,
    count: result.count,
    exceptSessionId,
  });

  return result.count;
}

/**
 * Clean up expired sessions (call periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - SESSION_DURATION_MS);
  
  const result = await prisma.userSession.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { lt: thirtyDaysAgo } },
      ],
    },
  });

  if (result.count > 0) {
    logger.info("Cleaned up expired sessions", {
      requestId: `session-cleanup-${Date.now()}`,
      count: result.count,
    });
  }

  return result.count;
}

/**
 * Get session count for a user
 */
export async function getActiveSessionCount(userId: string): Promise<number> {
  return prisma.userSession.count({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
}
