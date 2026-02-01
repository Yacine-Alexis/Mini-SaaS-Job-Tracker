import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Allowed origins for CSRF protection
function getAllowedOrigins(): string[] {
  const origins: string[] = [];
  
  // Add configured NEXTAUTH_URL
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (nextAuthUrl) {
    try {
      const url = new URL(nextAuthUrl);
      origins.push(url.origin);
    } catch {}
  }
  
  // Always allow localhost in development
  if (process.env.NODE_ENV !== "production") {
    origins.push("http://localhost:3000");
    origins.push("http://127.0.0.1:3000");
  }
  
  return origins;
}

// Check if request is a state-changing method
function isStateChangingMethod(method: string): boolean {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase());
}

// Paths that should skip CSRF check (webhooks with their own auth)
const CSRF_EXEMPT_PATHS = [
  "/api/billing/webhook", // Stripe webhooks have signature verification
  "/api/auth/",           // NextAuth handles its own CSRF
];

function shouldSkipCsrf(pathname: string): boolean {
  return CSRF_EXEMPT_PATHS.some(path => pathname.startsWith(path));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // CSRF Protection for state-changing requests
  if (isStateChangingMethod(req.method) && !shouldSkipCsrf(pathname)) {
    const origin = req.headers.get("origin");
    const allowedOrigins = getAllowedOrigins();
    
    // If origin header is present, validate it
    if (origin && allowedOrigins.length > 0) {
      const isAllowed = allowedOrigins.some(allowed => origin === allowed);
      if (!isAllowed) {
        console.warn(`[CSRF] Blocked request from origin: ${origin}, allowed: ${allowedOrigins.join(", ")}`);
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "Invalid origin" } },
          { status: 403 }
        );
      }
    }
  }

  const res = NextResponse.next();

  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // CSP Policy - restrictive but allows Next.js to function
  // In production, remove 'unsafe-eval' and use nonces for inline scripts
  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrc = isDev 
    ? "script-src 'self' 'unsafe-eval' 'unsafe-inline';" 
    : "script-src 'self' 'unsafe-inline';"; // unsafe-inline needed for Next.js hydration
  
  const csp = [
    "default-src 'self';",
    "img-src 'self' data: https:;",
    "style-src 'self' 'unsafe-inline';", // Tailwind requires unsafe-inline
    scriptSrc,
    "connect-src 'self' https://api.stripe.com;", // Restrict to self + Stripe API
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com;", // Stripe checkout
    "frame-ancestors 'none';",
    "form-action 'self';",
    "base-uri 'self';",
    "object-src 'none';",
    "upgrade-insecure-requests;"
  ].join(" ");

  res.headers.set("Content-Security-Policy", csp);

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)"
  ]
};
