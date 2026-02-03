/**
 * Web Vitals Performance Monitoring
 * 
 * Tracks Core Web Vitals metrics:
 * - LCP (Largest Contentful Paint): Loading performance
 * - FID (First Input Delay): Interactivity
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FCP (First Contentful Paint): First render
 * - TTFB (Time to First Byte): Server response time
 * - INP (Interaction to Next Paint): Responsiveness
 */

import { onLCP, onCLS, onFCP, onTTFB, onINP, Metric } from "web-vitals";
import * as Sentry from "@sentry/nextjs";

export type WebVitalName = "LCP" | "CLS" | "FCP" | "TTFB" | "INP";

export interface WebVitalThresholds {
  good: number;
  needsImprovement: number;
}

// Google's recommended thresholds for Core Web Vitals
// FID has been deprecated in favor of INP
export const THRESHOLDS: Record<WebVitalName, WebVitalThresholds> = {
  LCP: { good: 2500, needsImprovement: 4000 },
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 },
};

export type WebVitalRating = "good" | "needs-improvement" | "poor";

/**
 * Get the rating for a Web Vital metric
 */
export function getWebVitalRating(name: WebVitalName, value: number): WebVitalRating {
  const threshold = THRESHOLDS[name];
  if (!threshold) return "poor";
  
  if (value <= threshold.good) return "good";
  if (value <= threshold.needsImprovement) return "needs-improvement";
  return "poor";
}

export interface WebVitalReport {
  name: WebVitalName;
  value: number;
  rating: WebVitalRating;
  delta: number;
  id: string;
  navigationType: string;
}

type WebVitalCallback = (report: WebVitalReport) => void;

/**
 * Report handler that sends vitals to analytics endpoint
 */
async function sendToAnalytics(report: WebVitalReport): Promise<void> {
  // Skip in non-browser environments
  if (typeof window === "undefined") return;
  
  // Skip in development unless explicitly enabled
  if (process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_ENABLE_VITALS_DEV) {
    console.debug("[Web Vitals]", report.name, report.value, report.rating);
    return;
  }

  try {
    // Send to analytics endpoint using beacon API for reliability
    const body = JSON.stringify({
      name: report.name,
      value: report.value,
      rating: report.rating,
      delta: report.delta,
      id: report.id,
      navigationType: report.navigationType,
      page: window.location.pathname,
      timestamp: Date.now(),
    });

    // Prefer sendBeacon for reliability during page unload
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/vitals", body);
    } else {
      await fetch("/api/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      });
    }
  } catch (error) {
    // Silently fail - don't disrupt user experience for analytics
    console.debug("[Web Vitals] Failed to send:", error);
  }
}

/**
 * Report handler that sends vitals to Sentry for correlation with errors
 */
function sendToSentry(report: WebVitalReport): void {
  if (process.env.NODE_ENV !== "production") return;

  // Add Web Vital as a custom measurement
  Sentry.addBreadcrumb({
    category: "web-vitals",
    message: `${report.name}: ${report.value}ms (${report.rating})`,
    level: report.rating === "poor" ? "warning" : "info",
    data: {
      name: report.name,
      value: report.value,
      rating: report.rating,
      delta: report.delta,
    },
  });

  // For poor vitals, capture as a separate event
  if (report.rating === "poor") {
    Sentry.withScope((scope) => {
      scope.setTag("webvital.name", report.name);
      scope.setTag("webvital.rating", report.rating);
      scope.setExtra("webvital.value", report.value);
      scope.setExtra("webvital.threshold.good", THRESHOLDS[report.name]?.good);
      scope.setLevel("warning");
      
      Sentry.captureMessage(`Poor ${report.name}: ${report.value}ms`, "warning");
    });
  }
}

/**
 * Create a metric handler that transforms web-vitals Metric to our report format
 */
function createMetricHandler(callbacks: WebVitalCallback[]): (metric: Metric) => void {
  return (metric: Metric) => {
    const report: WebVitalReport = {
      name: metric.name as WebVitalName,
      value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      rating: getWebVitalRating(metric.name as WebVitalName, metric.value),
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    };

    callbacks.forEach((callback) => {
      try {
        callback(report);
      } catch (error) {
        console.debug("[Web Vitals] Callback error:", error);
      }
    });
  };
}

export interface WebVitalsOptions {
  /** Send to analytics endpoint */
  analytics?: boolean;
  /** Send to Sentry */
  sentry?: boolean;
  /** Custom callback */
  onReport?: WebVitalCallback;
}

/**
 * Initialize Web Vitals monitoring
 * Call this in your app's client-side entry point
 * 
 * @example
 * ```tsx
 * // In layout.tsx or providers.tsx
 * useEffect(() => {
 *   initWebVitals({ analytics: true, sentry: true });
 * }, []);
 * ```
 */
export function initWebVitals(options: WebVitalsOptions = {}): void {
  const { analytics = true, sentry = true, onReport } = options;

  const callbacks: WebVitalCallback[] = [];
  
  if (analytics) callbacks.push(sendToAnalytics);
  if (sentry) callbacks.push(sendToSentry);
  if (onReport) callbacks.push(onReport);

  if (callbacks.length === 0) return;

  const handler = createMetricHandler(callbacks);

  // Core Web Vitals
  onLCP(handler);
  onCLS(handler);
  
  // Additional vitals
  onFCP(handler);
  onTTFB(handler);
  onINP(handler);
}

/**
 * Report a custom performance metric
 */
export function reportCustomMetric(
  name: string,
  value: number,
  unit: "ms" | "count" | "percent" = "ms"
): void {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[Custom Metric]", name, value, unit);
    return;
  }

  Sentry.addBreadcrumb({
    category: "custom-metric",
    message: `${name}: ${value}${unit}`,
    level: "info",
    data: { name, value, unit },
  });
}

/**
 * Measure the duration of an async operation
 */
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    return await operation();
  } finally {
    const duration = performance.now() - start;
    reportCustomMetric(name, Math.round(duration), "ms");
  }
}

export default initWebVitals;
