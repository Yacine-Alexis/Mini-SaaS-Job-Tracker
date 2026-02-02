/**
 * Retry utility with exponential backoff for external service calls.
 */

import { logger } from "./logger";

export interface RetryOptions {
  /** Maximum number of retry attempts. Default: 3 */
  maxRetries?: number;
  /** Initial delay in milliseconds. Default: 1000 */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds. Default: 10000 */
  maxDelayMs?: number;
  /** Multiplier for exponential backoff. Default: 2 */
  backoffMultiplier?: number;
  /** Function to determine if error is retryable. Default: all errors */
  isRetryable?: (error: unknown) => boolean;
  /** Called before each retry attempt */
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
  /** Operation name for logging */
  operationName?: string;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'isRetryable' | 'operationName'>> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Default retryable error checker - retries on network errors and 5xx status codes
 */
export function isRetryableError(error: unknown): boolean {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  // Response with 5xx status (service unavailable, timeout, etc.)
  if (error instanceof Error && 'status' in error) {
    const status = (error as Error & { status: number }).status;
    return status >= 500 && status < 600;
  }
  
  // Timeout errors
  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }
  
  return false;
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic and exponential backoff.
 * 
 * @example
 * ```ts
 * const result = await withRetry(
 *   () => sendEmail(to, subject, body),
 *   { maxRetries: 3, onRetry: (attempt, err) => console.log(`Retry ${attempt}`) }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  let delay = opts.initialDelayMs;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const isRetryable = opts.isRetryable ?? isRetryableError;
      if (attempt >= opts.maxRetries || !isRetryable(error)) {
        throw error;
      }

      // Calculate delay with jitter (±10%)
      const jitter = delay * 0.1 * (Math.random() * 2 - 1);
      const actualDelay = Math.min(delay + jitter, opts.maxDelayMs);

      // Call onRetry callback if provided
      opts.onRetry?.(attempt + 1, error, actualDelay);

      // Wait before retrying
      await sleep(actualDelay);

      // Increase delay for next attempt
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
    }
  }

  throw lastError;
}

/**
 * Retry decorator for class methods
 */
export function Retryable(options: RetryOptions = {}) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: unknown[]) {
      return withRetry(() => originalMethod.apply(this, args), options);
    };
    
    return descriptor;
  };
}

/**
 * Check if a Stripe error is retryable
 * Retries on network errors, rate limits, and temporary server errors
 */
export function isStripeRetryable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  
  const err = error as { type?: string; statusCode?: number; code?: string };
  
  // Stripe rate limit errors
  if (err.type === "StripeRateLimitError") return true;
  
  // Stripe API connection errors (network issues)
  if (err.type === "StripeConnectionError") return true;
  
  // Stripe API errors with 5xx status codes
  if (err.type === "StripeAPIError" && err.statusCode && err.statusCode >= 500) return true;
  
  // Idempotency errors can be retried
  if (err.code === "idempotency_key_in_use") return true;
  
  // General network/fetch errors
  return isRetryableError(error);
}

/**
 * Check if an SMTP/email error is retryable
 */
export function isEmailRetryable(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  
  const err = error as { code?: string; responseCode?: number };
  
  // SMTP temporary failures (4xx codes are usually temporary)
  if (err.responseCode && err.responseCode >= 400 && err.responseCode < 500) return true;
  
  // Connection errors
  if (err.code === "ECONNRESET" || err.code === "ETIMEDOUT" || err.code === "ECONNREFUSED") return true;
  
  // General network errors
  return isRetryableError(error);
}

/**
 * Pre-configured retry for Stripe API calls
 */
export async function withStripeRetry<T>(
  fn: () => Promise<T>,
  operationName: string
): Promise<T> {
  return withRetry(fn, {
    maxRetries: 3,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    isRetryable: isStripeRetryable,
    operationName,
    onRetry: (attempt, error, delayMs) => {
      const errMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`Stripe retry: ${operationName}`, {
        requestId: "stripe-retry",
        error: errMessage,
        attempt: String(attempt),
        delayMs: String(delayMs),
      });
    },
  });
}

/**
 * Pre-configured retry for email sending
 */
export async function withEmailRetry<T>(
  fn: () => Promise<T>,
  operationName: string
): Promise<T> {
  return withRetry(fn, {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    isRetryable: isEmailRetryable,
    operationName,
    onRetry: (attempt, error, delayMs) => {
      const errMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`Email retry: ${operationName}`, {
        requestId: "email-retry",
        error: errMessage,
        attempt: String(attempt),
        delayMs: String(delayMs),
      });
    },
  });
}
