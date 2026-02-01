import { z } from "zod";
import { ApplicationStage, Priority, RemoteType, JobType } from "@prisma/client";

const applicationBaseSchema = z.object({
  company: z.string().min(1).max(120),
  title: z.string().min(1).max(120),
  location: z.string().max(120).optional().nullable(),
  url: z.string().url().optional().nullable(),
  salaryMin: z.number().int().min(0).optional().nullable(),
  salaryMax: z.number().int().min(0).optional().nullable(),
  salaryCurrency: z.string().max(10).optional().nullable(),
  stage: z.nativeEnum(ApplicationStage).optional(),
  appliedDate: z.string().datetime().optional().nullable(),
  source: z.string().max(120).optional().nullable(),
  tags: z.array(z.string().min(1).max(40)).optional(),
  // Extended fields
  priority: z.nativeEnum(Priority).optional().nullable(),
  remoteType: z.nativeEnum(RemoteType).optional().nullable(),
  jobType: z.nativeEnum(JobType).optional().nullable(),
  description: z.string().max(10000).optional().nullable(),
  nextFollowUp: z.string().datetime().optional().nullable(),
  rejectionReason: z.string().max(500).optional().nullable()
});

// Export the base type for use with type assertions
export type ApplicationBaseData = z.infer<typeof applicationBaseSchema>;
export type ApplicationUpdateData = Partial<ApplicationBaseData>;

// Salary validation function for manual use in routes
export function validateSalaryRange(data: { salaryMin?: number | null; salaryMax?: number | null }): boolean {
  if (data.salaryMin != null && data.salaryMax != null) {
    return data.salaryMin <= data.salaryMax;
  }
  return true;
}

// Use base schema without refine to preserve types - salary validation done manually in routes
export const applicationCreateSchema = applicationBaseSchema;

export const applicationUpdateSchema = applicationBaseSchema.partial();

// Sanitize search query - remove SQL wildcards and potentially dangerous characters
// Prisma uses parameterized queries but this adds defense in depth
function sanitizeSearchQuery(q: string): string {
  // Remove or escape characters that could cause issues
  return q
    .replace(/[%_]/g, "\\$&")     // Escape SQL LIKE wildcards
    .replace(/[\x00-\x1F\x7F]/g, "") // Remove control characters
    .trim();
}

export const applicationListQuerySchema = z.object({
  stage: z.nativeEnum(ApplicationStage).optional(),
  q: z.string().max(200).transform(sanitizeSearchQuery).optional(),
  tags: z.string().max(500).optional(), // comma-separated, limit length
  from: z.string().datetime().optional(), // appliedDate from
  to: z.string().datetime().optional(), // appliedDate to
  sortBy: z.enum(["company", "title", "stage", "updatedAt", "appliedDate", "createdAt"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional()
});
