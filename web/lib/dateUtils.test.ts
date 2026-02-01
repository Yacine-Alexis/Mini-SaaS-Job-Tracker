import { describe, it, expect } from "vitest";
import { formatDate, formatDateTime, formatRelative } from "./dateUtils";

describe("formatDate", () => {
  it("should return '—' for null", () => {
    expect(formatDate(null)).toBe("—");
  });

  it("should return '—' for undefined", () => {
    expect(formatDate(undefined)).toBe("—");
  });

  it("should return '—' for invalid date string", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });

  it("should format a valid Date object", () => {
    const date = new Date("2025-06-15T12:00:00Z");
    const result = formatDate(date);
    // Check it contains the year and some form of month/day
    expect(result).toContain("2025");
    expect(result).not.toBe("—");
  });

  it("should format a valid ISO string", () => {
    const result = formatDate("2025-12-25T00:00:00Z");
    expect(result).toContain("2025");
    expect(result).not.toBe("—");
  });
});

describe("formatDateTime", () => {
  it("should return '—' for null", () => {
    expect(formatDateTime(null)).toBe("—");
  });

  it("should return '—' for undefined", () => {
    expect(formatDateTime(undefined)).toBe("—");
  });

  it("should format a valid Date with time", () => {
    const date = new Date("2025-06-15T14:30:00Z");
    const result = formatDateTime(date);
    expect(result).toContain("2025");
    expect(result).not.toBe("—");
    // Should include some time component
    expect(result.length).toBeGreaterThan(10);
  });
});

describe("formatRelative", () => {
  it("should return '—' for null", () => {
    expect(formatRelative(null)).toBe("—");
  });

  it("should return '—' for undefined", () => {
    expect(formatRelative(undefined)).toBe("—");
  });

  it("should return '—' for invalid date", () => {
    expect(formatRelative("invalid")).toBe("—");
  });

  it("should return relative time for recent date", () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const result = formatRelative(yesterday);
    expect(result).not.toBe("—");
    // Format returns "1d ago" style
    expect(result).toMatch(/\d+[dhms]\s*ago|just now/i);
  });

  it("should handle dates in the past", () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = formatRelative(weekAgo);
    expect(result).not.toBe("—");
  });
});
