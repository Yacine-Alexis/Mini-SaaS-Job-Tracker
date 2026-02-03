/**
 * Web Vitals Collection Endpoint
 * 
 * Receives Web Vitals metrics from the client and stores/processes them.
 * In production, you might want to send these to an analytics service.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const webVitalSchema = z.object({
  name: z.enum(["LCP", "CLS", "FCP", "TTFB", "INP"]),
  value: z.number(),
  rating: z.enum(["good", "needs-improvement", "poor"]),
  delta: z.number(),
  id: z.string(),
  navigationType: z.string(),
  page: z.string(),
  timestamp: z.number(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = webVitalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid web vital data" },
        { status: 400 }
      );
    }

    const vital = parsed.data;

    // In production, you would:
    // 1. Store in a time-series database (InfluxDB, TimescaleDB)
    // 2. Send to an analytics service (Google Analytics, Vercel Analytics)
    // 3. Aggregate for dashboards
    
    // For now, we just log in development
    if (process.env.NODE_ENV !== "production") {
      console.log("[Web Vital]", {
        name: vital.name,
        value: vital.value,
        rating: vital.rating,
        page: vital.page,
      });
    }

    // Example: Store poor vitals for alerting
    if (vital.rating === "poor") {
      // Could trigger alerts, store in database, etc.
      console.warn(`[Poor Web Vital] ${vital.name}: ${vital.value} on ${vital.page}`);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    // Silent failure - don't disrupt analytics collection
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
