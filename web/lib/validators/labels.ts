import { z } from "zod";

// Valid hex color pattern
const hexColorPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const labelCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(30, "Name must be 30 characters or less"),
  color: z.string().regex(hexColorPattern, "Invalid hex color (e.g., #3b82f6)"),
});

export const labelUpdateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1).max(30).optional(),
  color: z.string().regex(hexColorPattern, "Invalid hex color").optional(),
});

export type LabelCreateInput = z.infer<typeof labelCreateSchema>;
export type LabelUpdateInput = z.infer<typeof labelUpdateSchema>;

// Predefined color palette for labels
export const LABEL_COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Orange", value: "#f97316" },
  { name: "Red", value: "#ef4444" },
  { name: "Pink", value: "#ec4899" },
  { name: "Purple", value: "#a855f7" },
  { name: "Indigo", value: "#6366f1" },
  { name: "Teal", value: "#14b8a6" },
  { name: "Gray", value: "#6b7280" },
];
