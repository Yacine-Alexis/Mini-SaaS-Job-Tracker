/**
 * Login attempt throttling to prevent brute force attacks.
 * Tracks failed login attempts and implements progressive lockout.
 * 
 * @module lib/loginThrottle
 */

import { logger } from "@/lib/logger";

/** Failed login attempt record */
interface LoginAttempt {
  count: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

/** Lockout configuration */
export const LOCKOUT_CONFIG = {
  /** Max failed attempts before lockout */
  MAX_ATTEMPTS: 5,
  /** Window to count attempts (15 minutes) */
  ATTEMPT_WINDOW_MS: 15 * 60 * 1000,
  /** Initial lockout duration (1 minute) */
  INITIAL_LOCKOUT_MS: 60 * 1000,
  /** Max lockout duration (15 minutes) */
  MAX_LOCKOUT_MS: 15 * 60 * 1000,
  /** Lockout multiplier for progressive lockout */
  LOCKOUT_MULTIPLIER: 2,
};

// In-memory store for login attempts (per IP + email combo)
const attempts = new Map<string, LoginAttempt>();

// Cleanup interval
const CLEANUP_INTERVAL = 60_000;
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, attempt] of attempts.entries()) {
      // Remove if window expired and not locked
      const windowExpired = now - attempt.firstAttempt > LOCKOUT_CONFIG.ATTEMPT_WINDOW_MS;
      const lockExpired = !attempt.lockedUntil || now > attempt.lockedUntil;
      if (windowExpired && lockExpired) {
        attempts.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
  if (cleanupTimer.unref) cleanupTimer.unref();
}

startCleanup();

/**
 * Generate a key for tracking attempts (IP + normalized email)
 */
export function getAttemptKey(ip: string, email: string): string {
  const normalizedEmail = email.toLowerCase().trim();
  return `login:${ip}:${normalizedEmail}`;
}

/**
 * Check if a login attempt is allowed (not locked out)
 * 
 * @returns Object with allowed status, remaining attempts, and lockout info
 */
export function checkLoginAllowed(key: string): {
  allowed: boolean;
  remainingAttempts: number;
  lockedUntilMs: number | null;
  retryAfterMs: number | null;
} {
  const now = Date.now();
  const attempt = attempts.get(key);

  // No previous attempts
  if (!attempt) {
    return {
      allowed: true,
      remainingAttempts: LOCKOUT_CONFIG.MAX_ATTEMPTS,
      lockedUntilMs: null,
      retryAfterMs: null,
    };
  }

  // Check if currently locked out
  if (attempt.lockedUntil && now < attempt.lockedUntil) {
    const retryAfterMs = attempt.lockedUntil - now;
    return {
      allowed: false,
      remainingAttempts: 0,
      lockedUntilMs: attempt.lockedUntil,
      retryAfterMs,
    };
  }

  // Check if attempt window expired (reset counter)
  if (now - attempt.firstAttempt > LOCKOUT_CONFIG.ATTEMPT_WINDOW_MS) {
    // Window expired, allow and will reset on next failure
    return {
      allowed: true,
      remainingAttempts: LOCKOUT_CONFIG.MAX_ATTEMPTS,
      lockedUntilMs: null,
      retryAfterMs: null,
    };
  }

  // Within window, check remaining attempts
  const remaining = LOCKOUT_CONFIG.MAX_ATTEMPTS - attempt.count;
  return {
    allowed: remaining > 0,
    remainingAttempts: Math.max(0, remaining),
    lockedUntilMs: null,
    retryAfterMs: null,
  };
}

/**
 * Record a failed login attempt
 * Returns the updated status including any new lockout
 */
export function recordFailedAttempt(key: string, ip: string, email: string): {
  locked: boolean;
  remainingAttempts: number;
  lockedUntilMs: number | null;
  lockoutDurationMs: number | null;
} {
  const now = Date.now();
  let attempt = attempts.get(key);

  // Reset if window expired or first attempt
  if (!attempt || now - attempt.firstAttempt > LOCKOUT_CONFIG.ATTEMPT_WINDOW_MS) {
    attempt = {
      count: 1,
      firstAttempt: now,
      lockedUntil: null,
    };
  } else {
    attempt.count += 1;
  }

  // Check if we need to lock out
  if (attempt.count >= LOCKOUT_CONFIG.MAX_ATTEMPTS) {
    // Calculate progressive lockout duration
    const lockoutMultiplier = Math.pow(
      LOCKOUT_CONFIG.LOCKOUT_MULTIPLIER,
      Math.floor(attempt.count / LOCKOUT_CONFIG.MAX_ATTEMPTS) - 1
    );
    const lockoutDuration = Math.min(
      LOCKOUT_CONFIG.INITIAL_LOCKOUT_MS * lockoutMultiplier,
      LOCKOUT_CONFIG.MAX_LOCKOUT_MS
    );
    
    attempt.lockedUntil = now + lockoutDuration;
    
    logger.warn("Account locked due to too many failed login attempts", {
      requestId: `login-throttle-${Date.now()}`,
      ip,
      email: email.replace(/(.{2}).*(@.*)/, "$1***$2"), // Mask email
      attemptCount: attempt.count,
      lockoutDurationMs: lockoutDuration,
    });

    attempts.set(key, attempt);
    
    return {
      locked: true,
      remainingAttempts: 0,
      lockedUntilMs: attempt.lockedUntil,
      lockoutDurationMs: lockoutDuration,
    };
  }

  attempts.set(key, attempt);
  
  const remaining = LOCKOUT_CONFIG.MAX_ATTEMPTS - attempt.count;
  
  logger.info("Failed login attempt recorded", {
    requestId: `login-throttle-${Date.now()}`,
    ip,
    email: email.replace(/(.{2}).*(@.*)/, "$1***$2"),
    attemptCount: attempt.count,
    remainingAttempts: remaining,
  });

  return {
    locked: false,
    remainingAttempts: remaining,
    lockedUntilMs: null,
    lockoutDurationMs: null,
  };
}

/**
 * Clear login attempts after successful login
 */
export function clearLoginAttempts(key: string): void {
  attempts.delete(key);
}

/**
 * Get current attempt count (for testing/monitoring)
 */
export function getAttemptCount(key: string): number {
  return attempts.get(key)?.count ?? 0;
}

/**
 * Format lockout duration for user-friendly message
 */
export function formatLockoutDuration(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

// Export for testing
export function _resetForTesting(): void {
  attempts.clear();
}
