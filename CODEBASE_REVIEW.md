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

### 4. Admin Password Stored as Environment Variable (Security Risk)
**Location:** [web/lib/auth.ts#L10-L12](web/lib/auth.ts#L10-L12)  
**Issue:** Hardcoded admin credentials from environment variables. The admin password is compared directly in plain text and the hash is only created for the database record.

**Risk:** If logs expose environment variables, the admin password is compromised.

**Fix:** Store only a password hash in environment variables, or remove this feature entirely and use proper database-backed admin users.

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

### 20. Hardcoded Page Size
**Location:** [web/components/ApplicationsClient.tsx#L33](web/components/ApplicationsClient.tsx#L33)  
**Issue:** Page size is hardcoded to 20:
```typescript
sp.set("pageSize", "20");
```

**Fix:** Make it configurable via state or settings.

---

### 21. Missing TypeScript Strict Mode Options
**Location:** [web/tsconfig.json](web/tsconfig.json)  
**Issue:** Should verify strict TypeScript options are enabled for better type safety.

**Fix:** Enable `strictNullChecks`, `strictFunctionTypes`, etc.

---

### 22. No API Response Type Consistency
**Location:** All API routes  
**Issue:** API responses have inconsistent shapes:
- Some return `{ item: ... }`
- Some return `{ items: [...] }`
- Some return `{ ok: true }`
- Some return `{ user: ... }`

**Fix:** Create a consistent API response wrapper.

---

### 23. Missing Error Boundary in React Components
**Location:** Client components  
**Issue:** No error boundaries to catch and display React rendering errors gracefully.

**Fix:** Add error boundary components.

---

### 24. Audit Logging Silent Failure
**Location:** [web/lib/audit.ts#L19-L21](web/lib/audit.ts#L19-L21)  
**Issue:** Audit logging failures are silently swallowed:
```typescript
} catch {
  // never block the request if audit logging fails
}
```

**Fix:** At minimum, log to console or a monitoring service.

---

### 25. Missing Database Connection Pooling Configuration
**Location:** [web/lib/db.ts](web/lib/db.ts)  
**Issue:** No explicit connection pool configuration for Prisma client.

**Fix:** Add connection pool settings for production.

---

### 26. No API Versioning
**Location:** API routes  
**Issue:** All routes are at `/api/...` with no version prefix.

**Fix:** Consider `/api/v1/...` for future breaking changes.

---

### 27. Missing Retry Logic for External Services
**Location:** Email and Stripe integrations  
**Issue:** No retry logic for transient failures when calling external services.

**Fix:** Implement retry with exponential backoff.

---

### 28. No Health Check Endpoint
**Location:** API routes  
**Issue:** No `/api/health` endpoint for monitoring/load balancer health checks.

**Fix:** Add a health check endpoint that verifies database connectivity.

---

### 29. Client-Side Date Handling Issues
**Location:** [web/components/ApplicationsClient.tsx#L38-L39](web/components/ApplicationsClient.tsx#L38-L39)  
**Issue:** Dates are converted to ISO without timezone consideration:
```typescript
if (from) sp.set("from", new Date(from).toISOString());
if (to) sp.set("to", new Date(to).toISOString());
```

**Fix:** Be explicit about timezone handling.

---

### 30. Missing Unit Tests for Validators
**Location:** [web/lib/validators/](web/lib/validators/)  
**Issue:** Zod validators have no unit tests to verify edge cases.

**Fix:** Add comprehensive tests for all validators.

---

### 31. Stripe API Version Hardcoded with Type Cast
**Location:** [web/lib/stripe.ts#L6](web/lib/stripe.ts#L6)  
**Issue:**
```typescript
return new Stripe(key, { apiVersion: "2024-06-20" as any });
```

The `as any` cast hides type mismatches.

**Fix:** Update to a compatible API version or update Stripe types.

---

### 32. No Request Timeout Configuration
**Location:** Fetch calls in components  
**Issue:** No timeout configured for fetch requests; they could hang indefinitely.

**Fix:** Add AbortController with timeout.

---

### 33. Missing Accessibility (a11y) Features
**Location:** Form components  
**Issue:** Missing ARIA labels, proper focus management, and keyboard navigation support.

**Fix:** Add proper accessibility attributes.

---

### 34. Docker Compose File Typo
**Location:** [web/docker.compose.yml](web/docker.compose.yml)  
**Issue:** The file is named `docker.compose.yml` instead of the standard `docker-compose.yml`.

**Fix:** Rename to `docker-compose.yml` or `compose.yml` (Docker Compose V2).

---

### 35. No Request Logging/Tracing
**Location:** Middleware and API routes  
**Issue:** No request ID or tracing for debugging production issues.

**Fix:** Add request IDs and structured logging.

---

### 36. Password Max Length Should Match bcrypt Limit
**Location:** [web/app/api/auth/register/route.ts#L9](web/app/api/auth/register/route.ts#L9)  
**Issue:** Password max is 72 chars (correct for bcrypt), but other validators use 200:
- Register: `z.string().min(8).max(72)`
- Change password: `z.string().min(8).max(200)`
- Reset password: `z.string().min(8).max(200)`

**Fix:** Use consistent 72-char max everywhere (bcrypt truncates at 72).

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
| 🔴 High   | 7     | 6     |
| 🟡 Medium | 10    | 0     |
| 🟢 Low    | 23    | 0     |
| **Total** | **40** | **6** |

---

## Recommended Order of Fixing

1. **Security issues first (1-7)**
2. **Data integrity issues (8-11)**
3. **Code quality issues (12-17)**
4. **Everything else in order of impact**

Would you like to start addressing these issues one by one?
