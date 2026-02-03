import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jsonError, zodToDetails } from "@/lib/errors";
import { requireUserOr401 } from "@/lib/auth";
import { bulkOperationSchema, type BulkOperationResult } from "@/lib/validators/bulkOperations";
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit";
import { enforceRateLimitAsync } from "@/lib/rateLimit";

/**
 * POST /api/applications/bulk
 * 
 * Bulk update or delete multiple applications at once.
 * Limited to 100 applications per request.
 * 
 * Body:
 * {
 *   "ids": ["cuid1", "cuid2", ...],
 *   "operation": "update" | "delete",
 *   "fields": {
 *     "stage": "INTERVIEW",      // Optional: new stage
 *     "priority": "HIGH",        // Optional: new priority
 *     "tags": ["react", "senior"], // Optional: replace all tags
 *     "addTags": ["urgent"],     // Optional: add to existing tags
 *     "removeTags": ["applied"]  // Optional: remove from existing tags
 *   }
 * }
 */
export async function POST(req: NextRequest) {
  // Rate limit: 10 bulk operations per minute per IP
  const rl = await enforceRateLimitAsync(req, "applications:bulk", 10, 60_000);
  if (rl) return rl;

  const { userId, error } = await requireUserOr401();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON");
  }

  const parsed = bulkOperationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "VALIDATION_ERROR", "Invalid bulk operation request", zodToDetails(parsed.error));
  }

  const { ids, operation, fields } = parsed.data;

  // Verify all applications belong to the user and are not deleted
  const validApplications = await prisma.jobApplication.findMany({
    where: {
      id: { in: ids },
      userId,
      deletedAt: null
    },
    select: { id: true, tags: true }
  });

  const validIds = new Set(validApplications.map(app => app.id));
  const invalidIds = ids.filter(id => !validIds.has(id));

  const result: BulkOperationResult = {
    success: true,
    updated: 0,
    deleted: 0,
    failed: invalidIds.length,
    errors: invalidIds.length > 0 
      ? invalidIds.map(id => ({ id, error: "Application not found or access denied" }))
      : undefined
  };

  if (validApplications.length === 0) {
    result.success = false;
    return NextResponse.json(result, { status: 200 });
  }

  const now = new Date();

  if (operation === "delete") {
    // Soft delete all valid applications
    const deleteResult = await prisma.jobApplication.updateMany({
      where: {
        id: { in: [...validIds] },
        userId,
        deletedAt: null
      },
      data: { deletedAt: now }
    });

    result.deleted = deleteResult.count;

    // Audit each deletion
    for (const id of validIds) {
      await audit(req, userId, AuditAction.APPLICATION_DELETED, {
        entity: "JobApplication",
        entityId: id,
        bulkOperation: true
      });
    }
  } else if (operation === "update" && fields) {
    // Build update data
    const updateData: Record<string, unknown> = {};

    if (fields.stage !== undefined) {
      updateData.stage = fields.stage;
    }

    if (fields.priority !== undefined) {
      updateData.priority = fields.priority;
    }

    // Handle tag operations
    if (fields.tags !== undefined) {
      // Replace all tags
      updateData.tags = fields.tags;
      
      // Bulk update with same tags for all
      const updateResult = await prisma.jobApplication.updateMany({
        where: {
          id: { in: [...validIds] },
          userId,
          deletedAt: null
        },
        data: updateData
      });
      result.updated = updateResult.count;
    } else if (fields.addTags || fields.removeTags) {
      // Need to update each application individually for tag modifications
      for (const app of validApplications) {
        let newTags = [...(app.tags || [])];

        if (fields.addTags) {
          // Add new tags (avoid duplicates)
          for (const tag of fields.addTags) {
            if (!newTags.includes(tag)) {
              newTags.push(tag);
            }
          }
        }

        if (fields.removeTags) {
          // Remove specified tags
          newTags = newTags.filter(tag => !fields.removeTags!.includes(tag));
        }

        await prisma.jobApplication.update({
          where: { id: app.id },
          data: { ...updateData, tags: newTags }
        });
        result.updated++;
      }
    } else if (Object.keys(updateData).length > 0) {
      // Bulk update without tag changes
      const updateResult = await prisma.jobApplication.updateMany({
        where: {
          id: { in: [...validIds] },
          userId,
          deletedAt: null
        },
        data: updateData
      });
      result.updated = updateResult.count;
    }

    // Audit each update
    for (const id of validIds) {
      await audit(req, userId, AuditAction.APPLICATION_UPDATED, {
        entity: "JobApplication",
        entityId: id,
        bulkOperation: true,
        fields: Object.keys(fields)
      });
    }
  }

  return NextResponse.json(result);
}
