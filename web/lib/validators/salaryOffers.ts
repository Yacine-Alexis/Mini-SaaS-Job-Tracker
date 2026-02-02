import { z } from "zod";

export const offerTypeSchema = z.enum([
  "INITIAL_OFFER",
  "COUNTER_OFFER",
  "REVISED_OFFER",
  "FINAL_OFFER",
]);

export type OfferType = z.infer<typeof offerTypeSchema>;

export const salaryOfferCreateSchema = z.object({
  applicationId: z.string().min(1, "Application ID is required"),
  type: offerTypeSchema.optional().default("INITIAL_OFFER"),
  baseSalary: z.number().int().positive("Base salary must be positive"),
  bonus: z.number().int().nonnegative().optional().nullable(),
  equity: z.string().max(500).optional().nullable(),
  signingBonus: z.number().int().nonnegative().optional().nullable(),
  benefits: z.string().max(1000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  offerDate: z.string().datetime().optional(),
  isAccepted: z.boolean().optional().nullable(),
  currency: z.string().length(3).optional().default("USD"),
});

export const salaryOfferUpdateSchema = z.object({
  id: z.string().min(1, "ID is required"),
  type: offerTypeSchema.optional(),
  baseSalary: z.number().int().positive().optional(),
  bonus: z.number().int().nonnegative().optional().nullable(),
  equity: z.string().max(500).optional().nullable(),
  signingBonus: z.number().int().nonnegative().optional().nullable(),
  benefits: z.string().max(1000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  offerDate: z.string().datetime().optional(),
  isAccepted: z.boolean().optional().nullable(),
  currency: z.string().length(3).optional(),
});

export type SalaryOfferCreateInput = z.infer<typeof salaryOfferCreateSchema>;
export type SalaryOfferUpdateInput = z.infer<typeof salaryOfferUpdateSchema>;

// Currency formatting helper
export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
];

export function formatCurrency(amount: number, currency: string = "USD"): string {
  const curr = CURRENCIES.find((c) => c.code === currency);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return curr ? `${curr.symbol}${formatted}` : `${currency} ${formatted}`;
}
