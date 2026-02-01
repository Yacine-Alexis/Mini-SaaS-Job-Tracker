import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";
import { NextRequest } from "next/server";
import { getClientIp } from "@/lib/rateLimit";

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
    console.error("[Audit] Failed to log action:", action, error instanceof Error ? error.message : error);
  }
}
