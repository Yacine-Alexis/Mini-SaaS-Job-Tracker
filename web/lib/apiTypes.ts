/**
 * Shared API response types for consistent response shapes.
 */

/** Standard error response shape */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/** Base response with optional error */
export interface ApiResponse<T = unknown> {
  error?: ApiError;
  data?: T;
}

/** Single item response */
export interface ApiItemResponse<T> extends ApiResponse<T> {
  item?: T;
}

/** List response with pagination */
export interface ApiListResponse<T> extends ApiResponse<T[]> {
  items?: T[];
  total?: number;
  page?: number;
  pageSize?: number;
}

/** Success response for mutations */
export interface ApiSuccessResponse extends ApiResponse<{ ok: boolean }> {
  ok?: boolean;
}

/** User response */
export interface ApiUserResponse extends ApiResponse<{ user: unknown }> {
  user?: {
    id: string;
    email: string;
    plan?: string;
    createdAt?: string;
  };
}

/**
 * Type guard to check if response is an error
 */
export function isApiError<T>(response: ApiResponse<T>): response is ApiResponse<T> & { error: ApiError } {
  return !!response.error;
}

/**
 * Helper to create consistent error response
 */
export function createApiError(code: string, message: string, details?: unknown): { error: ApiError } {
  return {
    error: { code, message, ...(details ? { details } : {}) }
  };
}

/**
 * Helper to create consistent success response
 */
export function createApiSuccess<T>(data: T): { data: T } {
  return { data };
}
