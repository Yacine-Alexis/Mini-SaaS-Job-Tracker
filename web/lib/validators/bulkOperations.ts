import { z } from "zod";
import { ApplicationStage, Priority } from "@prisma/client";

/**
 * Bulk operations schema for updating multiple applications at once.
 * Supports both updating and deleting (soft-delete) applications.
 */

// Fields that can be bulk updated
export const bulkUpdateFieldsSchema = z.object({
  stage: z.nativeEnum(ApplicationStage).optional(),
  priority: z.nativeEnum(Priority).optional().nullable(),
  tags: z.array(z.string().min(1).max(40)).optional(),
  addTags: z.array(z.string().min(1).max(40)).optional(),      // Add tags to existing
  removeTags: z.array(z.string().min(1).max(40)).optional(),   // Remove specific tags
}).refine(
  (data) => {
    // Can't use both tags (replace) and addTags/removeTags (modify)
    if (data.tags && (data.addTags || data.removeTags)) {
      return false;
    }
    return true;
  },
  { message: "Cannot use 'tags' with 'addTags' or 'removeTags'. Use 'tags' to replace, or addTags/removeTags to modify." }
);

export type BulkUpdateFields = z.infer<typeof bulkUpdateFieldsSchema>;

// Main bulk operation schema
export const bulkOperationSchema = z.object({
  ids: z.array(z.string().cuid()).min(1).max(100),  // Limit to 100 applications per operation
  operation: z.enum(["update", "delete"]),
  fields: bulkUpdateFieldsSchema.optional()
}).refine(
  (data) => {
    // If operation is "update", fields must be provided
    if (data.operation === "update" && !data.fields) {
      return false;
    }
    // If operation is "update", at least one field must be set
    if (data.operation === "update" && data.fields) {
      const { stage, priority, tags, addTags, removeTags } = data.fields;
      const hasField = stage !== undefined || 
                       priority !== undefined || 
                       tags !== undefined || 
                       (addTags && addTags.length > 0) || 
                       (removeTags && removeTags.length > 0);
      return hasField;
    }
    return true;
  },
  { message: "Update operation requires at least one field to update" }
);

export type BulkOperationInput = z.infer<typeof bulkOperationSchema>;

// Response types
export interface BulkOperationResult {
  success: boolean;
  updated: number;
  deleted: number;
  failed: number;
  errors?: Array<{ id: string; error: string }>;
}
