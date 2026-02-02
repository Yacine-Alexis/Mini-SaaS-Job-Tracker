/**
 * Sentry server-side configuration
 * This file configures error tracking for server-side errors (API routes, server components)
 */

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Only enable in production
  enabled: process.env.NODE_ENV === "production",
  
  // Performance Monitoring
  tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring
  
  // Environment tag
  environment: process.env.NODE_ENV,
  
  // Filter out noisy errors
  ignoreErrors: [
    // Expected errors that don't need tracking
    "UNAUTHORIZED",
    "FORBIDDEN", 
    "NOT_FOUND",
    "VALIDATION_ERROR",
    // Rate limiting is expected
    "RATE_LIMITED",
    // Stripe webhook signature errors (misconfigured webhooks)
    "No signatures found matching the expected signature for payload",
  ],
  
  // Sensitive data filtering
  beforeSend(event, hint) {
    // Don't send events in development
    if (process.env.NODE_ENV !== "production") {
      return null;
    }
    
    // Strip sensitive data from exception
    if (event.exception?.values) {
      event.exception.values = event.exception.values.map(exception => {
        if (exception.value) {
          // Remove emails
          exception.value = exception.value.replace(
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 
            "[EMAIL]"
          );
          // Remove potential API keys
          exception.value = exception.value.replace(
            /sk_[a-zA-Z0-9_]+/g,
            "[STRIPE_KEY]"
          );
        }
        return exception;
      });
    }
    
    // Strip user data except ID
    if (event.user) {
      event.user = { id: event.user.id };
    }
    
    return event;
  },
  
  // Include useful context
  initialScope: {
    tags: {
      app: "job-tracker-pro",
    },
  },
});
