import { z } from "zod";

export const contactCreateSchema = z.object({
  applicationId: z.string().min(1),
  name: z.string().min(1).max(120),
  email: z.string().email().max(255).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  role: z.string().max(120).optional().nullable(),
  company: z.string().max(120).optional().nullable()
});

export const contactUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().max(255).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  role: z.string().max(120).optional().nullable(),
  company: z.string().max(120).optional().nullable()
});

/** Inferred type for creating a contact */
export type ContactCreate = z.infer<typeof contactCreateSchema>;
/** Inferred type for updating a contact */
export type ContactUpdate = z.infer<typeof contactUpdateSchema>;
