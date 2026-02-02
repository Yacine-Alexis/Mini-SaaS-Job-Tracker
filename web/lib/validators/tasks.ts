import { z } from "zod";
import { TaskStatus } from "@prisma/client";

export const taskCreateSchema = z.object({
  applicationId: z.string().min(1),
  title: z.string().min(1).max(200),
  dueDate: z.string().datetime().optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional()
});

export const taskUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional()
});

/** Inferred type for creating a task */
export type TaskCreate = z.infer<typeof taskCreateSchema>;
/** Inferred type for updating a task */
export type TaskUpdate = z.infer<typeof taskUpdateSchema>;
