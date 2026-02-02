/**
 * Sentry error tracking utilities
 * Provides functions to capture errors with additional context
 */

import * as Sentry from "@sentry/nextjs";
import type { NextRequest } from "next/server";

/**
 * Set user context for Sentry (call after authentication)
 */
export function setUser(userId: string, email?: string, plan?: string) {
  Sentry.setUser({
    id: userId,
    // Don't include email in production for privacy
    ...(process.env.NODE_ENV !== "production" && email ? { email } : {}),
  });
  
  if (plan) {
    Sentry.setTag("user.plan", plan);
  }
}

/**
 * Clear user context (call on logout)
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Capture an exception with additional context
 */
export function captureException(
  error: unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: Sentry.SeverityLevel;
  }
) {
  Sentry.withScope((scope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    if (context?.level) {
      scope.setLevel(context.level);
    }
    Sentry.captureException(error);
  });
}

/**
 * Capture API route errors with request context
 */
export function captureApiError(
  error: unknown,
  req: NextRequest,
  context?: {
    userId?: string;
    extra?: Record<string, unknown>;
  }
) {
  const url = new URL(req.url);
  
  Sentry.withScope((scope) => {
    scope.setTag("api.method", req.method);
    scope.setTag("api.path", url.pathname);
    
    if (context?.userId) {
      scope.setUser({ id: context.userId });
    }
    
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    
    scope.setContext("request", {
      url: url.pathname,
      method: req.method,
      headers: {
        "user-agent": req.headers.get("user-agent"),
        "content-type": req.headers.get("content-type"),
      },
    });
    
    Sentry.captureException(error);
  });
}

/**
 * Create a breadcrumb for tracking user actions
 */
export function addBreadcrumb(
  message: string,
  category: "navigation" | "ui" | "http" | "info" | "debug" | "error",
  data?: Record<string, unknown>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level: "info",
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  op: string
): ReturnType<typeof Sentry.startInactiveSpan> {
  return Sentry.startInactiveSpan({
    name,
    op,
  });
}

/**
 * Wrap an async function with Sentry error tracking
 */
export function withErrorTracking<T>(
  fn: () => Promise<T>,
  context?: {
    operation: string;
    tags?: Record<string, string>;
  }
): Promise<T> {
  return Sentry.startSpan(
    {
      name: context?.operation ?? "unknown-operation",
      op: "function",
    },
    async () => {
      try {
        return await fn();
      } catch (error) {
        captureException(error, { tags: context?.tags });
        throw error;
      }
    }
  );
}
