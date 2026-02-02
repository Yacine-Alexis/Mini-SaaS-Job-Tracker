import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";
import { NextRequest } from "next/server";
import { getClientIp } from "@/lib/rateLimit";
import { logger, getRequestId } from "@/lib/logger";

export async function audit(req: NextRequest, userId: string, action: AuditAction, opts?: {
  entity?: string;
  entityId?: string;
  meta?: any;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity: opts?.entity ?? null,
        entityId: opts?.entityId ?? null,
        meta: opts?.meta ?? undefined,
        ip: getClientIp(req),
        userAgent: req.headers.get("user-agent") ?? null
      }
    });
  } catch (error) {
    // Log but never block the request if audit logging fails
    logger.error("Failed to log audit action", { 
      requestId: getRequestId(req),
      userId,
      action,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
