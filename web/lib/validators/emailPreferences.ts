import { z } from "zod";

export const digestFrequencySchema = z.enum([
  "NEVER",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
]);

export type DigestFrequency = z.infer<typeof digestFrequencySchema>;

export const emailPreferencesUpdateSchema = z.object({
  // Interview reminders
  interviewReminder: z.boolean().optional(),
  interviewReminderHours: z.number().int().min(1).max(168).optional(), // 1 hour to 7 days
  
  // Task due date reminders
  taskReminder: z.boolean().optional(),
  taskReminderHours: z.number().int().min(1).max(168).optional(),
  
  // Follow-up reminders
  followUpReminder: z.boolean().optional(),
  
  // Application status changes
  statusChangeNotify: z.boolean().optional(),
  
  // Digest emails
  digestFrequency: digestFrequencySchema.optional(),
  digestDay: z.number().int().min(0).max(6).optional(), // 0=Sun, 6=Sat
  digestHour: z.number().int().min(0).max(23).optional(),
  
  // Stale application alerts
  staleAlertEnabled: z.boolean().optional(),
  staleAlertDays: z.number().int().min(3).max(90).optional(),
  
  // Marketing emails
  marketingEmails: z.boolean().optional(),
  
  // Global unsubscribe
  unsubscribedAll: z.boolean().optional(),
});

export type EmailPreferencesUpdateInput = z.infer<typeof emailPreferencesUpdateSchema>;

// Default preferences for new users
export const DEFAULT_EMAIL_PREFERENCES = {
  interviewReminder: true,
  interviewReminderHours: 24,
  taskReminder: true,
  taskReminderHours: 24,
  followUpReminder: true,
  statusChangeNotify: true,
  digestFrequency: "WEEKLY" as const,
  digestDay: 1, // Monday
  digestHour: 9, // 9 AM
  staleAlertEnabled: true,
  staleAlertDays: 14,
  marketingEmails: false,
  unsubscribedAll: false,
};

// Helper to format reminder hours for display
export function formatReminderHours(hours: number): string {
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

// Digest frequency labels
export const DIGEST_FREQUENCY_LABELS: Record<DigestFrequency, string> = {
  NEVER: "Never",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
};

// Day of week labels
export const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
