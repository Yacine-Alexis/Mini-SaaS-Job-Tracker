import { z } from "zod";

export const attachmentLinkCreateSchema = z.object({
  applicationId: z.string().min(1),
  label: z.string().max(120).optional().nullable(),
  url: z.string().url().max(2000)
});

export const attachmentLinkUpdateSchema = z.object({
  label: z.string().max(120).optional().nullable(),
  url: z.string().url().max(2000).optional()
});
