import { z } from "zod";
import { ApplicationStage } from "@prisma/client";

const applicationBaseSchema = z.object({
  company: z.string().min(1).max(120),
  title: z.string().min(1).max(120),
  location: z.string().max(120).optional().nullable(),
  url: z.string().url().optional().nullable(),
  salaryMin: z.number().int().min(0).optional().nullable(),
  salaryMax: z.number().int().min(0).optional().nullable(),
  stage: z.nativeEnum(ApplicationStage).optional(),
  appliedDate: z.string().datetime().optional().nullable(),
  source: z.string().max(120).optional().nullable(),
  tags: z.array(z.string().min(1).max(40)).optional()
});

export const applicationCreateSchema = applicationBaseSchema.refine((v) => {
  if (v.salaryMin != null && v.salaryMax != null) return v.salaryMin <= v.salaryMax;
  return true;
}, { message: "salaryMin must be <= salaryMax", path: ["salaryMin"] });

export const applicationUpdateSchema = applicationBaseSchema.partial().refine((v) => {
  if (v.salaryMin != null && v.salaryMax != null) return v.salaryMin <= v.salaryMax;
  return true;
}, { message: "salaryMin must be <= salaryMax", path: ["salaryMin"] });

export const applicationListQuerySchema = z.object({
  stage: z.nativeEnum(ApplicationStage).optional(),
  q: z.string().max(200).optional(),
  tags: z.string().optional(), // comma-separated
  from: z.string().datetime().optional(), // appliedDate from
  to: z.string().datetime().optional() // appliedDate to
});
