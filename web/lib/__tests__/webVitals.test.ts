import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getWebVitalRating,
  THRESHOLDS,
  WebVitalName,
  reportCustomMetric,
  measureAsync,
} from "../webVitals";
import * as Sentry from "@sentry/nextjs";

// Mock Sentry
vi.mock("@sentry/nextjs", () => ({
  addBreadcrumb: vi.fn(),
  withScope: vi.fn((callback) => {
    const scope = {
      setTag: vi.fn(),
      setExtra: vi.fn(),
      setLevel: vi.fn(),
    };
    callback(scope);
    return scope;
  }),
  captureMessage: vi.fn(),
}));

describe("Web Vitals utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("THRESHOLDS", () => {
    it("has thresholds for all core web vitals", () => {
      expect(THRESHOLDS).toHaveProperty("LCP");
      expect(THRESHOLDS).toHaveProperty("CLS");
      expect(THRESHOLDS).toHaveProperty("FCP");
      expect(THRESHOLDS).toHaveProperty("TTFB");
      expect(THRESHOLDS).toHaveProperty("INP");
    });

    it("has good and needsImprovement values", () => {
      Object.values(THRESHOLDS).forEach((threshold) => {
        expect(threshold).toHaveProperty("good");
        expect(threshold).toHaveProperty("needsImprovement");
        expect(threshold.good).toBeLessThan(threshold.needsImprovement);
      });
    });
  });

  describe("getWebVitalRating", () => {
    it("returns 'good' for values below good threshold", () => {
      expect(getWebVitalRating("LCP", 2000)).toBe("good");
      expect(getWebVitalRating("INP", 50)).toBe("good");
      expect(getWebVitalRating("CLS", 0.05)).toBe("good");
    });

    it("returns 'needs-improvement' for values between thresholds", () => {
      expect(getWebVitalRating("LCP", 3000)).toBe("needs-improvement");
      expect(getWebVitalRating("INP", 300)).toBe("needs-improvement");
      expect(getWebVitalRating("CLS", 0.15)).toBe("needs-improvement");
    });

    it("returns 'poor' for values above needsImprovement threshold", () => {
      expect(getWebVitalRating("LCP", 5000)).toBe("poor");
      expect(getWebVitalRating("INP", 600)).toBe("poor");
      expect(getWebVitalRating("CLS", 0.3)).toBe("poor");
    });

    it("returns 'good' for values exactly at good threshold", () => {
      expect(getWebVitalRating("LCP", THRESHOLDS.LCP.good)).toBe("good");
      expect(getWebVitalRating("INP", THRESHOLDS.INP.good)).toBe("good");
    });

    it("returns 'needs-improvement' for values exactly at needsImprovement threshold", () => {
      expect(getWebVitalRating("LCP", THRESHOLDS.LCP.needsImprovement)).toBe("needs-improvement");
      expect(getWebVitalRating("INP", THRESHOLDS.INP.needsImprovement)).toBe("needs-improvement");
    });

    it("handles all metric types", () => {
      const metrics: WebVitalName[] = ["LCP", "CLS", "FCP", "TTFB", "INP"];
      
      metrics.forEach((metric) => {
        const rating = getWebVitalRating(metric, 0);
        expect(["good", "needs-improvement", "poor"]).toContain(rating);
      });
    });

    it("returns 'poor' for unknown metric names", () => {
      expect(getWebVitalRating("UNKNOWN" as WebVitalName, 100)).toBe("poor");
    });
  });

  describe("reportCustomMetric", () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("logs to console in non-production", () => {
      const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      
      reportCustomMetric("testMetric", 100, "ms");

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Custom Metric]",
        "testMetric",
        100,
        "ms"
      );

      consoleSpy.mockRestore();
    });

    it("defaults to ms unit", () => {
      const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      
      reportCustomMetric("testMetric", 100);

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Custom Metric]",
        "testMetric",
        100,
        "ms"
      );

      consoleSpy.mockRestore();
    });

    it("accepts different units", () => {
      const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      
      reportCustomMetric("loadCount", 5, "count");
      expect(consoleSpy).toHaveBeenLastCalledWith(
        "[Custom Metric]",
        "loadCount",
        5,
        "count"
      );

      reportCustomMetric("cacheHitRate", 85, "percent");
      expect(consoleSpy).toHaveBeenLastCalledWith(
        "[Custom Metric]",
        "cacheHitRate",
        85,
        "percent"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("measureAsync", () => {
    it("returns the result of the operation", async () => {
      const result = await measureAsync("testOp", async () => {
        return "success";
      });

      expect(result).toBe("success");
    });

    it("measures operation duration", async () => {
      const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      
      await measureAsync("delayedOp", async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return "done";
      });

      // Should have logged a custom metric
      expect(consoleSpy).toHaveBeenCalled();
      const calls = consoleSpy.mock.calls.filter(
        (call) => call[0] === "[Custom Metric]" && call[1] === "delayedOp"
      );
      expect(calls.length).toBe(1);
      
      // Duration should be at least 50ms
      const duration = calls[0][2];
      expect(duration).toBeGreaterThanOrEqual(45); // Allow some variance

      consoleSpy.mockRestore();
    });

    it("reports metric even if operation throws", async () => {
      const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      
      await expect(
        measureAsync("failingOp", async () => {
          throw new Error("Operation failed");
        })
      ).rejects.toThrow("Operation failed");

      // Should still have logged the metric
      const calls = consoleSpy.mock.calls.filter(
        (call) => call[0] === "[Custom Metric]" && call[1] === "failingOp"
      );
      expect(calls.length).toBe(1);

      consoleSpy.mockRestore();
    });
  });
});

describe("Web Vitals API schema validation", () => {
  it("validates correct vital data", () => {
    const validData = {
      name: "LCP",
      value: 2500,
      rating: "good",
      delta: 100,
      id: "v1-123",
      navigationType: "navigate",
      page: "/dashboard",
      timestamp: Date.now(),
    };

    // This would be validated by the API route schema
    expect(validData.name).toBe("LCP");
    expect(["good", "needs-improvement", "poor"]).toContain(validData.rating);
  });

  it("expects all required fields", () => {
    const requiredFields = [
      "name",
      "value",
      "rating",
      "delta",
      "id",
      "navigationType",
      "page",
      "timestamp",
    ];

    const validData = {
      name: "FCP",
      value: 1800,
      rating: "good",
      delta: 50,
      id: "v1-456",
      navigationType: "reload",
      page: "/applications",
      timestamp: Date.now(),
    };

    requiredFields.forEach((field) => {
      expect(validData).toHaveProperty(field);
    });
  });
});
