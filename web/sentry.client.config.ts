/**
 * Sentry client-side configuration
 * This file configures error tracking for browser-side errors
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Only enable in production
  enabled: process.env.NODE_ENV === "production",
  
  // Performance Monitoring
  tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring
  
  // Session Replay - capture 1% of sessions, 100% of sessions with errors
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
  
  // Environment tag
  environment: process.env.NODE_ENV,
  
  // Filter out noisy errors
  ignoreErrors: [
    // Browser extensions
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    // Network errors that are user-side issues
    "Network request failed",
    "Failed to fetch",
    "Load failed",
    "ChunkLoadError",
    // User cancelled
    "AbortError",
    "The operation was aborted",
  ],
  
  // Sensitive data filtering
  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV !== "production") {
      return null;
    }
    
    // Strip potential PII from error messages
    if (event.message) {
      event.message = event.message.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL]");
    }
    
    return event;
  },
  
  // Add integrations
  integrations: [
    Sentry.replayIntegration({
      // Mask all text and input content for privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
