import { z } from "zod";

export const noteCreateSchema = z.object({
  applicationId: z.string().min(1),
  content: z.string().min(1).max(5000)
});

export const noteUpdateSchema = z.object({
  content: z.string().min(1).max(5000)
});
