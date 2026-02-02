/**
 * Sentry Edge runtime configuration
 * This file configures error tracking for middleware and edge functions
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Only enable in production
  enabled: process.env.NODE_ENV === "production",
  
  // Performance Monitoring - lower sample rate for edge
  tracesSampleRate: 0.05, // Capture 5% of transactions
  
  // Environment tag
  environment: process.env.NODE_ENV,
  
  // Filter out expected errors
  ignoreErrors: [
    "FORBIDDEN", // CSRF rejections are expected
    "Invalid origin",
  ],
});
