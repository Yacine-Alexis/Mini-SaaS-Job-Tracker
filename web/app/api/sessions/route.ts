/**
 * Session management API for viewing and revoking active sessions.
 * 
 * GET /api/sessions - List active sessions
 * DELETE /api/sessions?id=xxx - Revoke a specific session
 * DELETE /api/sessions?all=true - Revoke all other sessions
 */

import { NextRequest, NextResponse } from "next/server";
import { requireUserOr401 } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { jsonError } from "@/lib/errors";
import { audit } from "@/lib/audit";
import { AuditAction } from "@prisma/client";
import { getClientIp } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  // Get all active (non-revoked, non-expired) sessions
  const sessions = await prisma.userSession.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      deviceType: true,
      browser: true,
      os: true,
      ip: true,
      country: true,
      city: true,
      createdAt: true,
      lastActiveAt: true,
      isCurrent: true,
    },
    orderBy: { lastActiveAt: "desc" },
  });

  return NextResponse.json({ sessions });
}

export async function DELETE(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const url = new URL(req.url);
  const sessionId = url.searchParams.get("id");
  const revokeAll = url.searchParams.get("all") === "true";

  if (!sessionId && !revokeAll) {
    return jsonError(400, "MISSING_PARAM", "Provide 'id' or 'all=true'");
  }

  const now = new Date();
  const ip = getClientIp(req);

  if (revokeAll) {
    // Revoke all sessions except current
    const result = await prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
        isCurrent: false,
      },
      data: { revokedAt: now },
    });

    await audit(req, userId, AuditAction.AUTH_LOGOUT, {
      action: "revoke_all_sessions",
      count: result.count,
      ip,
    });

    return NextResponse.json({
      success: true,
      revokedCount: result.count,
      message: `Revoked ${result.count} session${result.count === 1 ? "" : "s"}`,
    });
  }

  // Revoke specific session
  const session = await prisma.userSession.findFirst({
    where: { id: sessionId, userId },
  });

  if (!session) {
    return jsonError(404, "NOT_FOUND", "Session not found");
  }

  if (session.revokedAt) {
    return jsonError(400, "ALREADY_REVOKED", "Session already revoked");
  }

  if (session.isCurrent) {
    return jsonError(400, "CANNOT_REVOKE_CURRENT", "Cannot revoke current session. Use logout instead.");
  }

  await prisma.userSession.update({
    where: { id: sessionId },
    data: { revokedAt: now },
  });

  await audit(req, userId, AuditAction.AUTH_LOGOUT, {
    action: "revoke_session",
    sessionId,
    ip,
  });

  return NextResponse.json({
    success: true,
    message: "Session revoked successfully",
  });
}
