/**
 * Tests for login throttling functionality
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  getAttemptKey,
  checkLoginAllowed,
  recordFailedAttempt,
  clearLoginAttempts,
  getAttemptCount,
  formatLockoutDuration,
  LOCKOUT_CONFIG,
  _resetForTesting,
} from "@/lib/loginThrottle";

describe("loginThrottle", () => {
  beforeEach(() => {
    _resetForTesting();
  });

  describe("getAttemptKey", () => {
    it("creates consistent keys for same ip and email", () => {
      const key1 = getAttemptKey("192.168.1.1", "test@example.com");
      const key2 = getAttemptKey("192.168.1.1", "test@example.com");
      expect(key1).toBe(key2);
    });

    it("normalizes email to lowercase", () => {
      const key1 = getAttemptKey("192.168.1.1", "Test@Example.COM");
      const key2 = getAttemptKey("192.168.1.1", "test@example.com");
      expect(key1).toBe(key2);
    });

    it("trims email whitespace", () => {
      const key1 = getAttemptKey("192.168.1.1", "  test@example.com  ");
      const key2 = getAttemptKey("192.168.1.1", "test@example.com");
      expect(key1).toBe(key2);
    });

    it("creates different keys for different IPs", () => {
      const key1 = getAttemptKey("192.168.1.1", "test@example.com");
      const key2 = getAttemptKey("192.168.1.2", "test@example.com");
      expect(key1).not.toBe(key2);
    });

    it("creates different keys for different emails", () => {
      const key1 = getAttemptKey("192.168.1.1", "test1@example.com");
      const key2 = getAttemptKey("192.168.1.1", "test2@example.com");
      expect(key1).not.toBe(key2);
    });
  });

  describe("checkLoginAllowed", () => {
    it("allows first login attempt", () => {
      const key = getAttemptKey("192.168.1.1", "test@example.com");
      const result = checkLoginAllowed(key);
      
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(LOCKOUT_CONFIG.MAX_ATTEMPTS);
      expect(result.lockedUntilMs).toBeNull();
      expect(result.retryAfterMs).toBeNull();
    });

    it("allows attempts within limit", () => {
      const key = getAttemptKey("192.168.1.1", "test@example.com");
      
      // Record some failed attempts (less than max)
      for (let i = 0; i < LOCKOUT_CONFIG.MAX_ATTEMPTS - 1; i++) {
        recordFailedAttempt(key, "192.168.1.1", "test@example.com");
      }

      const result = checkLoginAllowed(key);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(1);
    });

    it("blocks attempts after lockout", () => {
      const key = getAttemptKey("192.168.1.1", "test@example.com");
      
      // Record max failed attempts to trigger lockout
      for (let i = 0; i < LOCKOUT_CONFIG.MAX_ATTEMPTS; i++) {
        recordFailedAttempt(key, "192.168.1.1", "test@example.com");
      }

      const result = checkLoginAllowed(key);
      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
      expect(result.lockedUntilMs).not.toBeNull();
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });
  });

  describe("recordFailedAttempt", () => {
    it("increments attempt count", () => {
      const key = getAttemptKey("192.168.1.1", "test@example.com");
      
      recordFailedAttempt(key, "192.168.1.1", "test@example.com");
      expect(getAttemptCount(key)).toBe(1);
      
      recordFailedAttempt(key, "192.168.1.1", "test@example.com");
      expect(getAttemptCount(key)).toBe(2);
    });

    it("returns remaining attempts", () => {
      const key = getAttemptKey("192.168.1.1", "test@example.com");
      
      const result = recordFailedAttempt(key, "192.168.1.1", "test@example.com");
      expect(result.remainingAttempts).toBe(LOCKOUT_CONFIG.MAX_ATTEMPTS - 1);
      expect(result.locked).toBe(false);
    });

    it("triggers lockout at max attempts", () => {
      const key = getAttemptKey("192.168.1.1", "test@example.com");
      
      // Record up to max - 1 attempts
      for (let i = 0; i < LOCKOUT_CONFIG.MAX_ATTEMPTS - 1; i++) {
        const result = recordFailedAttempt(key, "192.168.1.1", "test@example.com");
        expect(result.locked).toBe(false);
      }

      // This should trigger lockout
      const result = recordFailedAttempt(key, "192.168.1.1", "test@example.com");
      expect(result.locked).toBe(true);
      expect(result.remainingAttempts).toBe(0);
      expect(result.lockedUntilMs).not.toBeNull();
      expect(result.lockoutDurationMs).toBe(LOCKOUT_CONFIG.INITIAL_LOCKOUT_MS);
    });

    it("uses progressive lockout for repeated lockouts", () => {
      const key = getAttemptKey("192.168.1.1", "test@example.com");
      
      // First lockout
      for (let i = 0; i < LOCKOUT_CONFIG.MAX_ATTEMPTS; i++) {
        recordFailedAttempt(key, "192.168.1.1", "test@example.com");
      }
      
      // Continue failing - second set of max attempts (progressive lockout)
      for (let i = 0; i < LOCKOUT_CONFIG.MAX_ATTEMPTS; i++) {
        recordFailedAttempt(key, "192.168.1.1", "test@example.com");
      }

      // Should have longer lockout
      const totalAttempts = getAttemptCount(key);
      expect(totalAttempts).toBe(LOCKOUT_CONFIG.MAX_ATTEMPTS * 2);
    });
  });

  describe("clearLoginAttempts", () => {
    it("clears attempts after successful login", () => {
      const key = getAttemptKey("192.168.1.1", "test@example.com");
      
      // Record some failed attempts
      recordFailedAttempt(key, "192.168.1.1", "test@example.com");
      recordFailedAttempt(key, "192.168.1.1", "test@example.com");
      expect(getAttemptCount(key)).toBe(2);

      // Clear on successful login
      clearLoginAttempts(key);
      expect(getAttemptCount(key)).toBe(0);

      // Should be fully allowed again
      const result = checkLoginAllowed(key);
      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(LOCKOUT_CONFIG.MAX_ATTEMPTS);
    });
  });

  describe("formatLockoutDuration", () => {
    it("formats seconds correctly", () => {
      expect(formatLockoutDuration(1000)).toBe("1 second");
      expect(formatLockoutDuration(5000)).toBe("5 seconds");
      expect(formatLockoutDuration(30000)).toBe("30 seconds");
    });

    it("formats minutes correctly", () => {
      expect(formatLockoutDuration(60000)).toBe("1 minute");
      expect(formatLockoutDuration(120000)).toBe("2 minutes");
      expect(formatLockoutDuration(300000)).toBe("5 minutes");
      expect(formatLockoutDuration(900000)).toBe("15 minutes");
    });

    it("rounds up partial minutes", () => {
      expect(formatLockoutDuration(61000)).toBe("2 minutes");
      expect(formatLockoutDuration(90000)).toBe("2 minutes");
    });
  });

  describe("LOCKOUT_CONFIG", () => {
    it("has sensible default values", () => {
      expect(LOCKOUT_CONFIG.MAX_ATTEMPTS).toBeGreaterThanOrEqual(3);
      expect(LOCKOUT_CONFIG.MAX_ATTEMPTS).toBeLessThanOrEqual(10);
      expect(LOCKOUT_CONFIG.ATTEMPT_WINDOW_MS).toBeGreaterThanOrEqual(60000);
      expect(LOCKOUT_CONFIG.INITIAL_LOCKOUT_MS).toBeGreaterThanOrEqual(30000);
      expect(LOCKOUT_CONFIG.MAX_LOCKOUT_MS).toBeGreaterThanOrEqual(LOCKOUT_CONFIG.INITIAL_LOCKOUT_MS);
    });
  });

  describe("isolation between users", () => {
    it("tracks attempts separately per IP+email", () => {
      const key1 = getAttemptKey("192.168.1.1", "user1@example.com");
      const key2 = getAttemptKey("192.168.1.1", "user2@example.com");
      const key3 = getAttemptKey("192.168.1.2", "user1@example.com");

      // Fail user1 from IP1
      recordFailedAttempt(key1, "192.168.1.1", "user1@example.com");
      recordFailedAttempt(key1, "192.168.1.1", "user1@example.com");

      // user2 from same IP should have fresh attempts
      expect(checkLoginAllowed(key2).remainingAttempts).toBe(LOCKOUT_CONFIG.MAX_ATTEMPTS);
      
      // user1 from different IP should have fresh attempts
      expect(checkLoginAllowed(key3).remainingAttempts).toBe(LOCKOUT_CONFIG.MAX_ATTEMPTS);
      
      // Original key should have reduced attempts
      expect(checkLoginAllowed(key1).remainingAttempts).toBe(LOCKOUT_CONFIG.MAX_ATTEMPTS - 2);
    });
  });
});
