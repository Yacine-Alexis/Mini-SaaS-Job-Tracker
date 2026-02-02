import { NextRequest } from "next/server";
import { jsonError } from "@/lib/errors";
import { logger } from "@/lib/logger";

type Bucket = { count: number; resetAt: number };

// In-memory store with automatic cleanup
const buckets = new Map<string, Bucket>();
const CLEANUP_INTERVAL = 60_000; // Clean up expired buckets every minute
const MAX_BUCKETS = 10_000; // Prevent memory exhaustion

// Periodic cleanup of expired buckets
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (now > bucket.resetAt) {
        buckets.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
  // Don't prevent process exit
  if (cleanupTimer.unref) cleanupTimer.unref();
}

// Start cleanup on module load
startCleanup();

export function getClientIp(req: NextRequest) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  // Try other common headers
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

/**
 * Redis-based rate limiting for production (when UPSTASH_REDIS_REST_URL is set)
 * Falls back to in-memory for development
 */
async function rateLimitRedis(opts: { key: string; limit: number; windowMs: number }): Promise<{
  ok: boolean;
  remaining: number;
  retryAfterMs?: number;
}> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    // Fall back to in-memory
    return rateLimitMemory(opts);
  }

  try {
    const windowSec = Math.ceil(opts.windowMs / 1000);
    const now = Date.now();
    const windowKey = `${opts.key}:${Math.floor(now / opts.windowMs)}`;

    // Increment counter with Upstash REST API
    const incrResponse = await fetch(`${redisUrl}/incr/${encodeURIComponent(windowKey)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${redisToken}` }
    });

    if (!incrResponse.ok) {
      logger.error("Redis INCR failed, falling back to memory", { requestId: "rate-limit", key: opts.key });
      return rateLimitMemory(opts);
    }

    const incrData = await incrResponse.json();
    const count = incrData.result as number;

    // Set expiry on first request in window
    if (count === 1) {
      await fetch(`${redisUrl}/expire/${encodeURIComponent(windowKey)}/${windowSec}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${redisToken}` }
      });
    }

    if (count > opts.limit) {
      const windowStart = Math.floor(now / opts.windowMs) * opts.windowMs;
      const retryAfterMs = windowStart + opts.windowMs - now;
      return { ok: false, remaining: 0, retryAfterMs };
    }

    return { ok: true, remaining: opts.limit - count };
  } catch (err) {
    logger.error("Redis error, falling back to memory", { 
      requestId: "rate-limit", 
      key: opts.key, 
      error: err instanceof Error ? err.message : String(err) 
    });
    return rateLimitMemory(opts);
  }
}

/**
 * In-memory rate limiting (for development or fallback)
 */
function rateLimitMemory(opts: { key: string; limit: number; windowMs: number }) {
  const now = Date.now();
  const b = buckets.get(opts.key);

  // Prevent memory exhaustion - if too many buckets, do a forced cleanup
  if (buckets.size > MAX_BUCKETS) {
    for (const [key, bucket] of buckets.entries()) {
      if (now > bucket.resetAt) {
        buckets.delete(key);
      }
    }
    // If still too many, clear oldest half
    if (buckets.size > MAX_BUCKETS) {
      const entries = Array.from(buckets.entries());
      entries.sort((a, b) => a[1].resetAt - b[1].resetAt);
      const toDelete = entries.slice(0, Math.floor(entries.length / 2));
      for (const [key] of toDelete) {
        buckets.delete(key);
      }
    }
  }

  if (!b || now > b.resetAt) {
    buckets.set(opts.key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true as const, remaining: opts.limit - 1 };
  }

  if (b.count >= opts.limit) {
    return { ok: false as const, remaining: 0, retryAfterMs: b.resetAt - now };
  }

  b.count += 1;
  buckets.set(opts.key, b);
  return { ok: true as const, remaining: opts.limit - b.count };
}

/**
 * Synchronous rate limit check (uses in-memory only)
 * For backwards compatibility
 */
export function rateLimit(opts: { key: string; limit: number; windowMs: number }) {
  return rateLimitMemory(opts);
}

/**
 * Async rate limit check (uses Redis in production, memory in dev)
 */
export async function rateLimitAsync(opts: { key: string; limit: number; windowMs: number }) {
  return rateLimitRedis(opts);
}

/**
 * Enforce rate limit on a request - async version for production
 * Uses Redis when UPSTASH_REDIS_REST_URL is configured
 */
export async function enforceRateLimitAsync(
  req: NextRequest,
  routeName: string,
  limit = 5,
  windowMs = 60_000
) {
  const ip = getClientIp(req);
  const key = `rl:${routeName}:${ip}`;
  const rl = await rateLimitAsync({ key, limit, windowMs });

  if (!rl.ok) {
    return jsonError(429, "RATE_LIMITED", "Too many requests. Try again soon.", {
      retryAfterMs: rl.retryAfterMs
    });
  }
  return null;
}

/**
 * Enforce rate limit on a request - sync version (in-memory only)
 * @deprecated Use enforceRateLimitAsync for production
 */
export function enforceRateLimit(req: NextRequest, routeName: string, limit = 5, windowMs = 60_000) {
  const ip = getClientIp(req);
  const key = `rl:${routeName}:${ip}`;
  const rl = rateLimitMemory({ key, limit, windowMs });

  if (!rl.ok) {
    return jsonError(429, "RATE_LIMITED", "Too many requests. Try again soon.", {
      retryAfterMs: rl.retryAfterMs
    });
  }
  return null;
}
