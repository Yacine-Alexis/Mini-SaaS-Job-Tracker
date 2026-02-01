/**
 * Fetch wrapper with timeout support.
 * Prevents requests from hanging indefinitely.
 */

const DEFAULT_TIMEOUT_MS = 30_000; // 30 seconds

export interface FetchOptions extends RequestInit {
  /** Request timeout in milliseconds. Default: 30000 (30s) */
  timeoutMs?: number;
}

export class FetchTimeoutError extends Error {
  constructor(url: string, timeoutMs: number) {
    super(`Request to ${url} timed out after ${timeoutMs}ms`);
    this.name = "FetchTimeoutError";
  }
}

/**
 * Fetch with automatic timeout using AbortController.
 * 
 * @example
 * ```ts
 * const res = await fetchWithTimeout("/api/data", { timeoutMs: 5000 });
 * ```
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new FetchTimeoutError(url, timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Typed JSON fetch helper with timeout.
 * Parses response as JSON and returns typed result.
 * 
 * @example
 * ```ts
 * const { items } = await fetchJson<{ items: App[] }>("/api/apps");
 * ```
 */
export async function fetchJson<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const response = await fetchWithTimeout(url, options);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message || `Request failed: ${response.status}`);
  }
  
  return response.json();
}
