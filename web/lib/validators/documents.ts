import { z } from "zod";

export const documentTypeSchema = z.enum(["RESUME", "COVER_LETTER", "PORTFOLIO", "OTHER"]);

export const documentCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: documentTypeSchema.default("RESUME"),
  fileName: z.string().min(1).max(500),
  fileUrl: z.string().url().max(2000).nullish(),
  fileContent: z.string().max(100000).nullish(), // 100KB text limit
  version: z.string().max(50).nullish(),
  applicationId: z.string().min(1).nullish(),
  isDefault: z.boolean().default(false),
});

export const documentUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  type: documentTypeSchema.optional(),
  fileName: z.string().min(1).max(500).optional(),
  fileUrl: z.string().url().max(2000).nullish(),
  fileContent: z.string().max(100000).nullish(),
  version: z.string().max(50).nullish(),
  applicationId: z.string().min(1).nullish(),
  isDefault: z.boolean().optional(),
});

export const documentListQuerySchema = z.object({
  type: documentTypeSchema.optional(),
  applicationId: z.string().min(1).optional(),
});
