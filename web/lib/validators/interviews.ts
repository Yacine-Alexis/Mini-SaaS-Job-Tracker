import { z } from "zod";
import { InterviewType, InterviewResult } from "@prisma/client";

export const interviewCreateSchema = z.object({
  applicationId: z.string().min(1),
  scheduledAt: z.string().datetime(),
  duration: z.number().int().min(15).max(480).optional().nullable(), // 15 min to 8 hours
  type: z.nativeEnum(InterviewType).optional(),
  location: z.string().max(500).optional().nullable(),
  interviewers: z.array(z.string().min(1).max(100)).optional(),
  notes: z.string().max(5000).optional().nullable(),
  feedback: z.string().max(5000).optional().nullable(),
  result: z.nativeEnum(InterviewResult).optional()
});

export const interviewUpdateSchema = interviewCreateSchema.partial().omit({ applicationId: true });

export const interviewListQuerySchema = z.object({
  applicationId: z.string().min(1).optional(),
  upcoming: z.enum(["true", "false"]).optional(), // Filter for future interviews only
  result: z.nativeEnum(InterviewResult).optional()
});
