import { z } from "zod";
import { ApplicationStage } from "@prisma/client";

export const importRowSchema = z.object({
  company: z.string().min(1).max(120),
  title: z.string().min(1).max(120),
  stage: z.nativeEnum(ApplicationStage).optional(),
  location: z.string().max(120).optional().nullable(),
  url: z.string().url().max(2000).optional().nullable(),
  source: z.string().max(120).optional().nullable(),
  appliedDate: z.string().datetime().optional().nullable(),
  salaryMin: z.number().int().nonnegative().optional().nullable(),
  salaryMax: z.number().int().nonnegative().optional().nullable(),
  tags: z.array(z.string().min(1).max(40)).optional()
});

export const importPayloadSchema = z.object({
  rows: z.array(importRowSchema).min(1).max(500)
});
