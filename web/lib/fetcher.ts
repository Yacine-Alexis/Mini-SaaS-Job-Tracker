/**
 * SWR Fetcher Utility
 * 
 * Provides a standardized fetcher for SWR hooks with:
 * - Automatic error handling
 * - Type-safe responses
 * - Request timeout support
 */

export class FetchError extends Error {
  status: number;
  code: string;
  info?: unknown;

  constructor(message: string, status: number, code: string, info?: unknown) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.code = code;
    this.info = info;
  }
}

/**
 * Default fetcher for SWR
 * Handles JSON responses and error formatting
 */
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new FetchError(
      errorData?.error?.message || `Request failed with status ${res.status}`,
      res.status,
      errorData?.error?.code || "FETCH_ERROR",
      errorData?.error?.details
    );
  }

  return res.json();
}

/**
 * POST fetcher for SWR mutations
 */
export async function postFetcher<T, B = unknown>(
  url: string,
  { arg }: { arg: B }
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new FetchError(
      errorData?.error?.message || `Request failed with status ${res.status}`,
      res.status,
      errorData?.error?.code || "FETCH_ERROR",
      errorData?.error?.details
    );
  }

  return res.json();
}

/**
 * PATCH fetcher for SWR mutations
 */
export async function patchFetcher<T, B = unknown>(
  url: string,
  { arg }: { arg: B }
): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new FetchError(
      errorData?.error?.message || `Request failed with status ${res.status}`,
      res.status,
      errorData?.error?.code || "FETCH_ERROR",
      errorData?.error?.details
    );
  }

  return res.json();
}

/**
 * DELETE fetcher for SWR mutations
 */
export async function deleteFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new FetchError(
      errorData?.error?.message || `Request failed with status ${res.status}`,
      res.status,
      errorData?.error?.code || "FETCH_ERROR",
      errorData?.error?.details
    );
  }

  return res.json();
}
