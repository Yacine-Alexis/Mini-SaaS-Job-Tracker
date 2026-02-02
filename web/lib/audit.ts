/**
 * Audit logging utilities for tracking user actions.
 * All mutations should be audited for security and compliance.
 * @module lib/audit
 */

import { prisma } from "@/lib/db";
import { AuditAction } from "@prisma/client";
import { NextRequest } from "next/server";
import { getClientIp } from "@/lib/rateLimit";
import { logger, getRequestId } from "@/lib/logger";

/**
 * Options for the audit log entry.
 */
export interface AuditOptions {
  /** The type of entity being acted upon (e.g., "Application", "Note") */
  entity?: string;
  /** The unique identifier of the entity */
  entityId?: string;
  /** Additional metadata to store with the audit log */
  meta?: object;
}

/**
 * Records an audit log entry for a user action.
 * 
 * This function is non-blocking - if audit logging fails, it logs the error
 * but does not throw, ensuring the main request continues.
 * 
 * @param req - The incoming request (used to extract IP and user agent)
 * @param userId - The ID of the user performing the action
 * @param action - The type of action being performed
 * @param opts - Optional additional information about the action
 * 
 * @example
 * ```ts
 * // After creating an application
 * await audit(req, userId, AuditAction.APPLICATION_CREATED, {
 *   entity: "Application",
 *   entityId: newApp.id
 * });
 * 
 * // After a billing event
 * await audit(req, userId, AuditAction.BILLING_UPGRADED, {
 *   meta: { from: "FREE", to: "PRO" }
 * });
 * ```
 */
export async function audit(
  req: NextRequest, 
  userId: string, 
  action: AuditAction, 
  opts?: AuditOptions
): Promise<void> {
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
