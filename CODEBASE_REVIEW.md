# Codebase Review: Issues & Improvements

This document contains a comprehensive analysis of the Mini-SaaS-Job-Tracker codebase.
Each item is numbered so we can address them one by one.

---

## 🔴 HIGH PRIORITY (Security & Bugs)

### 1. ✅ FIXED - Missing Rate Limiting on Critical Endpoints
**Location:** Multiple API routes  
**Status:** Fixed on 2026-02-01

Rate limiting added to:
- `POST /api/applications` (60/min)
- `POST /api/auth/register` (10/hour)
- `POST /api/notes`, `POST /api/tasks`, `POST /api/contacts`, `POST /api/attachment-links` (30/min each)
- `POST /api/billing/create-checkout-session` (5/min)
- `POST /api/applications/import` (5/min)

---

### 2. ✅ FIXED - In-Memory Rate Limiting Won't Work in Production
**Location:** [web/lib/rateLimit.ts](web/lib/rateLimit.ts)  
**Status:** Fixed on 2026-02-01

Implemented:
- Redis support via Upstash (set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`)
- Automatic fallback to in-memory for development
- Memory cleanup with periodic garbage collection
- Max bucket limit (10,000) to prevent memory exhaustion
- New `enforceRateLimitAsync()` function for production use

---

### 3. ✅ FIXED - Missing `deletedAt` Check in Password Reset Flow
**Location:** [web/app/api/auth/forgot/route.ts](web/app/api/auth/forgot/route.ts#L24)  
**Status:** Fixed on 2026-02-01

Changed from `findUnique({ where: { email } })` to `findFirst({ where: { email, deletedAt: null } })`.

---

### 4. ✅ FIXED - Admin Password Stored as Environment Variable (Security Risk)
**Location:** [web/lib/auth.ts](web/lib/auth.ts)  
**Status:** Fixed on 2026-02-01

**Issue:** Hardcoded admin credentials from environment variables with plain text password comparison.

**Fix Applied:** Removed the hardcoded admin credential system entirely. All users (including admins) now authenticate through proper database-backed authentication with bcrypt password hashing. Admin users should be created through the normal registration flow or database seeding with properly hashed passwords.

---

### 5. ✅ FIXED - No CSRF Protection on State-Changing Endpoints
**Location:** [web/middleware.ts](web/middleware.ts)  
**Status:** Fixed on 2026-02-01

Implemented Origin header validation in middleware:
- Validates Origin header against allowed origins (from `NEXTAUTH_URL`)
- Blocks requests from unauthorized origins with 403 response
- Exempts webhook routes that have their own authentication (Stripe, NextAuth)
- Allows localhost origins in development mode

---

### 6. ✅ FIXED - Potential XSS in Password Reset Email
**Location:** [web/lib/email.ts](web/lib/email.ts)  
**Status:** Fixed on 2026-02-01

Added:
- `escapeHtml()` function to escape HTML entities (`<`, `>`, `&`, `"`, `'`)
- `escapeUrl()` function to validate URL protocol (only http/https allowed)
- Both functions applied to reset URL before HTML interpolation

---

### 7. ✅ FIXED - Stripe Webhook Missing Event Signature Validation Logging
**Location:** [web/app/api/billing/webhook/route.ts](web/app/api/billing/webhook/route.ts)  
**Status:** Fixed on 2026-02-01

Added comprehensive logging:
- Log errors when Stripe is not configured
- Log when signature header is missing
- Log signature verification failures with error message
- Log successfully received events with type and ID
- Log user upgrades/downgrades
- Log warnings when user not found for customer ID

---

## 🟡 MEDIUM PRIORITY (Code Quality & Reliability)

### 8. ✅ FIXED - Inconsistent Error Handling in JSON Parsing
**Location:** Multiple API routes  
**Issue:** Some routes use `.catch(() => null)` for JSON parsing, while the register route doesn't.
**Status:** Already handled in register route - uses `.catch(() => null)`.

---

### 9. ✅ FIXED - Missing Cascade Delete for Soft-Deleted Applications
**Location:** [web/app/api/applications/[id]/route.ts](web/app/api/applications/[id]/route.ts)  
**Issue:** When an application is soft-deleted, its related notes/tasks/contacts/links remained active.
**Fix Applied:** DELETE handler now cascades soft-delete to all related items using `$transaction`.

---

### 10. ✅ FIXED - Missing Transaction for Application Delete
**Location:** [web/app/api/applications/[id]/route.ts](web/app/api/applications/[id]/route.ts)  
**Issue:** Deleting an application should also soft-delete related items atomically.
**Fix Applied:** Wrapped in a Prisma `$transaction` with `updateMany` for all related models.

---

### 11. ✅ FIXED - No Pagination on Dashboard Query
**Location:** [web/app/api/dashboard/route.ts](web/app/api/dashboard/route.ts)  
**Issue:** Fetched ALL applications for a user into memory, risking memory issues.
**Fix Applied:** Replaced with database aggregation using `groupBy`, `count`, and parallel weekly counts.

---

### 12. ✅ FIXED - `any` Type Usage in Prisma Queries
**Location:** [web/app/api/applications/route.ts](web/app/api/applications/route.ts)  
**Issue:** `where` clauses used `any` type.
**Fix Applied:** Created typed `buildApplicationFilter()` function in shared validators.

---

### 13. ✅ FIXED - Missing Index for Tags Search
**Location:** [prisma/schema.prisma](prisma/schema.prisma)  
**Issue:** The `tags` field is queried with `hasSome` but has no GIN index.
**Fix Applied:** Added `@@index([tags], type: Gin)` to JobApplication model.

---

### 14. Environment Variable Validation Not Used Everywhere
**Location:** [web/lib/env.ts](web/lib/env.ts)  
**Issue:** The `env.ts` file validates environment variables, but it's not imported anywhere. Variables are accessed directly via `process.env` throughout the codebase.

**Fix:** Import and use the validated `env` object consistently.

---

### 15. ✅ FIXED - Duplicate Query Schema Definitions
**Location:** Multiple route files  
**Issue:** `listQuerySchema` was defined identically in notes, tasks, contacts, attachment-links routes.
**Fix Applied:** Created `listByApplicationSchema` in [web/lib/validators/shared.ts](web/lib/validators/shared.ts) and updated all routes.

---

### 16. ✅ FIXED - CSP Policy is Too Permissive
**Location:** [web/middleware.ts](web/middleware.ts)  
**Issue:** The Content Security Policy allowed `'unsafe-eval'` and `'unsafe-inline'` everywhere.
**Fix Applied:** Improved CSP with:
- Environment-aware policy (removes `unsafe-eval` in production)
- Restricted `connect-src` to self + Stripe API only
- Added `frame-src` for Stripe checkout
- Added `form-action`, `base-uri`, `object-src` restrictions
- Added `upgrade-insecure-requests` directive

---

### 17. ✅ FIXED - No Input Sanitization on Search Query
**Location:** [web/lib/validators/applications.ts](web/lib/validators/applications.ts)  
**Issue:** The search query `q` was passed directly to Prisma's `contains`.
**Fix Applied:** Added `sanitizeSearchQuery()` function that:
- Escapes SQL LIKE wildcards (`%`, `_`)
- Removes control characters
- Added length limit to `tags` parameter

---

## 🟢 LOW PRIORITY (Improvements & Best Practices)

### 18. Missing Loading States in Components
**Location:** Various components  
**Issue:** Delete operations in `ApplicationsClient` and other components show loading state but the entire table isn't disabled, allowing double-clicks.

**Fix:** Disable the entire action area during operations.

---

### 19. No Optimistic Updates in UI
**Location:** All client components  
**Issue:** All CRUD operations wait for server response before updating UI, causing perceived slowness.

**Fix:** Implement optimistic updates with rollback on error.

---

### 20. ✅ FIXED - Hardcoded Page Size
**Location:** [web/components/ApplicationsClient.tsx](web/components/ApplicationsClient.tsx)  
**Issue:** Page size was hardcoded to 20.
**Fix Applied:** Added configurable page size selector (10, 20, 50, 100) in the pagination controls.

---

### 21. ✅ VERIFIED - TypeScript Strict Mode Options
**Location:** [web/tsconfig.json](web/tsconfig.json)  
**Status:** Already has `"strict": true` which enables all strict checks.

---

### 22. ✅ FIXED - No API Response Type Consistency
**Location:** [web/lib/apiTypes.ts](web/lib/apiTypes.ts)  
**Issue:** API responses had inconsistent shapes.
**Fix Applied:** Created shared API response types (`ApiItemResponse`, `ApiListResponse`, `ApiSuccessResponse`, etc.) and type guards.

---

### 23. ✅ FIXED - Missing Error Boundary in React Components
**Location:** [web/components/ErrorBoundary.tsx](web/components/ErrorBoundary.tsx)  
**Issue:** No error boundaries to catch and display React rendering errors gracefully.
**Fix Applied:** Created `ErrorBoundary` class component and `withErrorBoundary` HOC with styled fallback UI.

---

### 24. ✅ FIXED - Audit Logging Silent Failure
**Location:** [web/lib/audit.ts](web/lib/audit.ts)  
**Issue:** Audit logging failures were silently swallowed.
**Fix Applied:** Added `console.error` logging with action name and error message.

---

### 25. ✅ FIXED - Missing Database Connection Pooling Configuration
**Location:** [web/lib/db.ts](web/lib/db.ts)  
**Issue:** No explicit connection pool configuration for Prisma client.
**Fix Applied:** Added documentation for connection pooling via DATABASE_URL params. Production uses error-only logging.

---

### 26. No API Versioning
**Location:** API routes  
**Issue:** All routes are at `/api/...` with no version prefix.

**Fix:** Consider `/api/v1/...` for future breaking changes.

---

### 27. ✅ FIXED - Missing Retry Logic for External Services
**Location:** [web/lib/retry.ts](web/lib/retry.ts)  
**Issue:** No retry logic for transient failures when calling external services.
**Fix Applied:** Created `withRetry()` utility with exponential backoff, jitter, configurable options, and `@Retryable` decorator.

---

### 28. ✅ FIXED - No Health Check Endpoint
**Location:** [web/app/api/health/route.ts](web/app/api/health/route.ts)  
**Issue:** No `/api/health` endpoint for monitoring/load balancer health checks.
**Fix Applied:** Created health check endpoint that verifies database connectivity and returns latency.

---

### 29. Client-Side Date Handling Issues
**Location:** [web/components/ApplicationsClient.tsx#L38-L39](web/components/ApplicationsClient.tsx#L38-L39)  
**Issue:** Dates are converted to ISO without timezone consideration.

**Fix:** Be explicit about timezone handling.

---

### 30. Missing Unit Tests for Validators
**Location:** [web/lib/validators/](web/lib/validators/)  
**Issue:** Zod validators have no unit tests to verify edge cases.

**Fix:** Add comprehensive tests for all validators.

---

### 31. ✅ FIXED - Stripe API Version Hardcoded with Type Cast
**Location:** [web/lib/stripe.ts](web/lib/stripe.ts)  
**Issue:** `apiVersion: "2024-06-20" as any` cast hid type mismatches.
**Fix Applied:** Changed to use `as Stripe.LatestApiVersion` type assertion and added explicit return type.

---

### 32. ✅ FIXED - No Request Timeout Configuration
**Location:** [web/lib/fetch.ts](web/lib/fetch.ts)  
**Issue:** No timeout configured for fetch requests; they could hang indefinitely.
**Fix Applied:** Created `fetchWithTimeout()` utility with AbortController (30s default timeout).

---

### 33. ✅ FIXED - Missing Accessibility (a11y) Features
**Location:** [web/components/ApplicationForm.tsx](web/components/ApplicationForm.tsx)  
**Issue:** Missing ARIA labels, proper focus management, and keyboard navigation support.
**Fix Applied:** Added `aria-invalid`, `aria-describedby`, `aria-required`, `aria-hidden`, and `role="alert"` to form inputs and error messages.

---

### 34. ✅ FIXED - Docker Compose File Typo
**Location:** [web/docker-compose.yml](web/docker-compose.yml)  
**Issue:** File was named `docker.compose.yml` instead of standard `docker-compose.yml`.
**Fix Applied:** Renamed to `docker-compose.yml`.

---

### 35. ✅ FIXED - No Request Logging/Tracing
**Location:** [web/lib/logger.ts](web/lib/logger.ts)  
**Issue:** No request ID or tracing for debugging production issues.
**Fix Applied:** Created structured logger with request ID generation, timing utilities, and JSON-formatted log output.

---

### 36. ✅ FIXED - Password Max Length Should Match bcrypt Limit
**Location:** Multiple validators  
**Issue:** Password max was inconsistent (72 vs 200 chars). bcrypt truncates at 72 bytes.
**Fix Applied:** Updated change-password and reset-password validators to use `.max(72)`.

---

### 37. Missing Proper TypeScript Return Types
**Location:** Multiple functions  
**Issue:** Many functions don't have explicit return types, relying on inference.

**Fix:** Add explicit return types for public functions.

---

### 38. Unused Dependencies Check Needed
**Location:** [web/package.json](web/package.json)  
**Issue:** Should verify all dependencies are actually used.

**Fix:** Run `npm-check` or similar to identify unused packages.

---

### 39. No Database Backup Strategy Documented
**Location:** Documentation  
**Issue:** No documentation about database backup/recovery procedures.

**Fix:** Document backup strategy in README.

---

### 40. Email Template Should Be Customizable
**Location:** [web/lib/email.ts](web/lib/email.ts)  
**Issue:** Email templates are hardcoded inline.

**Fix:** Move to template files or a template system.

---

## Summary

| Priority | Count | Fixed |
|----------|-------|-------|
| 🔴 High   | 7     | 7     |
| 🟡 Medium | 10    | 9     |
| 🟢 Low    | 23    | 15    |
| **Total** | **40** | **31** |

---

## Remaining Issues

**High Priority (0 remaining):**
All high priority issues have been fixed! ✅

**Medium Priority (1 remaining):**
- #14: Environment variable validation not used everywhere

**Low Priority (8 remaining):**
- #18: Missing loading states in components
- #19: No optimistic updates in UI
- #26: No API versioning
- #29: Client-side date handling issues
- #30: Missing unit tests for validators
- #37: Missing proper TypeScript return types
- #38: Unused dependencies check needed
- #39: No database backup strategy documented
- #40: Email template should be customizable
