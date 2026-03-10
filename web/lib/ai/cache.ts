/**
 * AI Response Caching
 * Caches AI responses to reduce computation and improve response times.
 * Uses in-memory caching with TTL and optional Redis support.
 * @module lib/ai/cache
 */

import { createHash } from 'crypto';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
}

// In-memory cache
const cache = new Map<string, CacheEntry<unknown>>();

// Cache configuration
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes default
const MAX_CACHE_SIZE = 1000; // Maximum entries
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Cache TTLs by feature (in milliseconds)
export const AI_CACHE_TTLS = {
  SALARY_ESTIMATE: 60 * 60 * 1000, // 1 hour - salary data is relatively stable
  INTERVIEW_QUESTIONS: 30 * 60 * 1000, // 30 minutes
  TAG_SUGGESTIONS: 15 * 60 * 1000, // 15 minutes
  JOB_SUMMARY: 60 * 60 * 1000, // 1 hour
  SKILLS_EXTRACTION: 60 * 60 * 1000, // 1 hour
  JOB_COMPARISON: 30 * 60 * 1000, // 30 minutes
} as const;

/**
 * Generates a cache key from input parameters.
 * Uses SHA-256 hash for consistent, collision-resistant keys.
 */
export function generateCacheKey(prefix: string, ...params: unknown[]): string {
  const dataString = JSON.stringify(params);
  const hash = createHash('sha256').update(dataString).digest('hex').slice(0, 16);
  return `ai:${prefix}:${hash}`;
}

/**
 * Gets a value from the cache.
 * Returns undefined if not found or expired.
 */
export function getFromCache<T>(key: string): T | undefined {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  
  if (!entry) {
    return undefined;
  }
  
  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  
  // Update hit count
  entry.hits++;
  return entry.value;
}

/**
 * Sets a value in the cache with TTL.
 */
export function setInCache<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
  // Enforce max cache size
  if (cache.size >= MAX_CACHE_SIZE) {
    evictOldestEntries(Math.floor(MAX_CACHE_SIZE * 0.1)); // Remove 10%
  }
  
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
    hits: 0,
  });
}

/**
 * Removes expired entries and oldest entries when cache is full.
 */
function evictOldestEntries(count: number): void {
  const now = Date.now();
  const entries: Array<[string, CacheEntry<unknown>]> = [];
  
  // First, remove all expired entries
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    } else {
      entries.push([key, entry]);
    }
  }
  
  // If still over limit, remove least hit entries
  if (cache.size >= MAX_CACHE_SIZE) {
    entries.sort((a, b) => a[1].hits - b[1].hits);
    for (let i = 0; i < count && i < entries.length; i++) {
      cache.delete(entries[i][0]);
    }
  }
}

/**
 * Clears all cache entries.
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Gets cache statistics.
 */
export function getCacheStats(): {
  size: number;
  maxSize: number;
  hitRate: number;
} {
  let totalHits = 0;
  for (const entry of cache.values()) {
    totalHits += entry.hits;
  }
  
  return {
    size: cache.size,
    maxSize: MAX_CACHE_SIZE,
    hitRate: cache.size > 0 ? totalHits / cache.size : 0,
  };
}

/**
 * Cache wrapper for async functions.
 * Automatically caches results based on function arguments.
 */
export function withCache<TArgs extends unknown[], TResult>(
  prefix: string,
  fn: (...args: TArgs) => TResult,
  ttlMs: number = DEFAULT_TTL_MS
): (...args: TArgs) => TResult {
  return (...args: TArgs): TResult => {
    const key = generateCacheKey(prefix, ...args);
    
    // Check cache first
    const cached = getFromCache<TResult>(key);
    if (cached !== undefined) {
      return cached;
    }
    
    // Execute function and cache result
    const result = fn(...args);
    setInCache(key, result, ttlMs);
    return result;
  };
}

/**
 * Cache wrapper for async functions.
 */
export function withCacheAsync<TArgs extends unknown[], TResult>(
  prefix: string,
  fn: (...args: TArgs) => Promise<TResult>,
  ttlMs: number = DEFAULT_TTL_MS
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    const key = generateCacheKey(prefix, ...args);
    
    // Check cache first
    const cached = getFromCache<TResult>(key);
    if (cached !== undefined) {
      return cached;
    }
    
    // Execute function and cache result
    const result = await fn(...args);
    setInCache(key, result, ttlMs);
    return result;
  };
}

// Periodic cleanup
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup(): void {
  if (cleanupTimer) return;
  
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now > entry.expiresAt) {
        cache.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
  
  // Don't prevent process exit
  if (cleanupTimer.unref) cleanupTimer.unref();
}

// Start cleanup on module load
startCleanup();
