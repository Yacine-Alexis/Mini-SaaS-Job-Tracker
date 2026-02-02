import { NextResponse } from "next/server";
import type { ZodError, typeToFlattenedError } from "zod";

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
  | "DUPLICATE";

export interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: unknown;
  };
}

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

export function zodToDetails<T>(err: ZodError<T>): typeToFlattenedError<T> {
  return err.flatten();
}
