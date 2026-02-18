/**
 * API error handling utilities.
 * Provides standardized error responses for API routes.
 * @module lib/errors
 */

import { NextResponse } from "next/server";
import type { ZodError, ZodFlattenedError } from "zod";

/**
 * Standard API error codes used across all endpoints.
 * These codes are returned in the `error.code` field of error responses.
 */
export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "BAD_REQUEST"
  | "INTERNAL_ERROR"
  | "RATE_LIMITED"
  | "INVALID_TOKEN"
  | "NOT_CONFIGURED"
  | "PLAN_LIMIT"
  | "PLAN_REQUIRED"
  | "INVALID_CREDENTIALS"
  | "INVALID_JSON"
  | "DUPLICATE"
  // 2FA related
  | "INVALID_2FA_CODE"
  | "INVALID_ACTION"
  | "ALREADY_ENABLED"
  | "USER_NOT_FOUND"
  | "SETUP_EXPIRED"
  | "INVALID_CODE"
  // Session related
  | "MISSING_PARAM"
  | "ALREADY_REVOKED"
  | "CANNOT_REVOKE_CURRENT"
  // Login related
  | "ACCOUNT_LOCKED"
  | "OAUTH_ONLY";

/**
 * Standard API error response structure.
 */
export interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

/**
 * Creates a standardized JSON error response for API routes.
 * 
 * @param status - HTTP status code (e.g., 400, 401, 403, 404, 500)
 * @param code - Error code for programmatic handling
 * @param message - Human-readable error message
 * @param details - Optional additional error details (e.g., validation errors)
 * @returns NextResponse with JSON error body
 * 
 * @example
 * ```ts
 * // Simple error
 * return jsonError(404, "NOT_FOUND", "Application not found");
 * 
 * // With validation details
 * return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));
 * ```
 */
export function jsonError(
  status: number,
  code: ApiErrorCode,
  message: string,
  details?: unknown
): NextResponse<ApiError> {
  return NextResponse.json(
    { error: { code, message, details } },
    { status }
  );
}

/**
 * Converts a Zod validation error into a flattened format suitable for API responses.
 * 
 * @param err - The Zod error to convert
 * @returns Flattened error object with field-level and form-level errors
 * 
 * @example
 * ```ts
 * const parsed = schema.safeParse(body);
 * if (!parsed.success) {
 *   return jsonError(400, "VALIDATION_ERROR", "Invalid input", zodToDetails(parsed.error));
 * }
 * ```
 */
export function zodToDetails<T>(err: ZodError<T>): ZodFlattenedError<T> {
  return err.flatten();
}
