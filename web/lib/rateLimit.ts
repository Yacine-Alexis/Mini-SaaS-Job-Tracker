import { NextRequest } from "next/server";
import { jsonError } from "@/lib/errors";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function getClientIp(req: NextRequest) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return "unknown";
}

export function rateLimit(opts: { key: string; limit: number; windowMs: number }) {
  const now = Date.now();
  const b = buckets.get(opts.key);

  if (!b || now > b.resetAt) {
    buckets.set(opts.key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true as const, remaining: opts.limit - 1 };
  }

  if (b.count >= opts.limit) {
    return { ok: false as const, retryAfterMs: b.resetAt - now };
  }

  b.count += 1;
  buckets.set(opts.key, b);
  return { ok: true as const, remaining: opts.limit - b.count };
}

export function enforceRateLimit(req: NextRequest, routeName: string, limit = 5, windowMs = 60_000) {
  const ip = getClientIp(req);
  const key = `${routeName}:${ip}`;
  const rl = rateLimit({ key, limit, windowMs });

  if (!rl.ok) {
    return jsonError(429, "RATE_LIMITED", "Too many requests. Try again soon.", {
      retryAfterMs: rl.retryAfterMs
    });
  }
  return null;
}
