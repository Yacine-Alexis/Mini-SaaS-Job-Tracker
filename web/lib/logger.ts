/**
 * Request logging and tracing utilities.
 * Adds request IDs for debugging production issues.
 */

import { NextRequest } from "next/server";
import { headers } from "next/headers";

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `req_${timestamp}_${random}`;
}

/**
 * Get or generate request ID from headers
 */
export function getRequestId(req?: NextRequest): string {
  // Check for existing request ID (e.g., from load balancer)
  const existingId = req?.headers.get("x-request-id") ?? req?.headers.get("x-correlation-id");
  if (existingId) return existingId;
  
  return generateRequestId();
}

/**
 * Get request ID from server component context
 */
export async function getServerRequestId(): Promise<string> {
  const headersList = await headers();
  const existingId = headersList.get("x-request-id") ?? headersList.get("x-correlation-id");
  return existingId ?? generateRequestId();
}

export interface LogContext {
  requestId: string;
  method?: string;
  path?: string;
  userId?: string;
  duration?: number;
  status?: number;
  error?: string;
  [key: string]: unknown;
}

/**
 * Structured logger for API requests
 */
export const logger = {
  /**
   * Log an info message with context
   */
  info(message: string, context: Partial<LogContext> = {}) {
    const entry = {
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      ...context
    };
    console.log(JSON.stringify(entry));
  },

  /**
   * Log a warning message with context
   */
  warn(message: string, context: Partial<LogContext> = {}) {
    const entry = {
      level: "warn",
      message,
      timestamp: new Date().toISOString(),
      ...context
    };
    console.warn(JSON.stringify(entry));
  },

  /**
   * Log an error message with context
   */
  error(message: string, context: Partial<LogContext> = {}) {
    const entry = {
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      ...context
    };
    console.error(JSON.stringify(entry));
  },

  /**
   * Log API request with timing
   */
  request(req: NextRequest, context: Partial<LogContext> & { requestId: string }) {
    const url = new URL(req.url);
    this.info("API Request", {
      ...context,
      method: req.method,
      path: url.pathname,
      query: url.search || undefined
    });
  },

  /**
   * Log API response with timing
   */
  response(
    req: NextRequest,
    status: number,
    context: Partial<LogContext> & { requestId: string; duration: number }
  ) {
    const url = new URL(req.url);
    const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
    
    this[level]("API Response", {
      ...context,
      method: req.method,
      path: url.pathname,
      status
    });
  }
};

/**
 * Measure execution time of an async function
 */
export async function withTiming<T>(
  fn: () => Promise<T>
): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  const durationMs = Math.round(performance.now() - start);
  return { result, durationMs };
}
