import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().email().max(255)
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(8).max(200)
});
