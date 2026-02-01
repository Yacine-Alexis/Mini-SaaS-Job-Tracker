# Codebase Review: Issues & Improvements

This document contains a comprehensive analysis of the Mini-SaaS-Job-Tracker codebase.
Each item is numbered so we can address them one by one.

---

## 🔴 HIGH PRIORITY (Security & Bugs)

### 1. Missing Rate Limiting on Critical Endpoints
**Location:** Multiple API routes  
**Issue:** Rate limiting is only applied to auth-related routes (`forgot`, `reset`, `change-password`, `delete`), but missing from:
- `POST /api/applications` (creation spam)
- `POST /api/auth/register` (registration spam/enumeration)
- `POST /api/notes`, `POST /api/tasks`, `POST /api/contacts` (spam)
- `POST /api/billing/create-checkout-session`

**Risk:** Without rate limiting, malicious users could:
- Create thousands of applications to exhaust database storage
- Perform brute-force attacks on registration
- Cause denial of service

**Fix:** Add `enforceRateLimit()` to all POST endpoints.

---

### 2. In-Memory Rate Limiting Won't Work in Production
**Location:** [web/lib/rateLimit.ts](web/lib/rateLimit.ts)  
**Issue:** Rate limiting uses an in-memory `Map`, which:
- Resets on server restart
- Doesn't work across multiple serverless instances/containers
- Memory leak potential (buckets never cleaned up)

**Fix:** Use Redis or a distributed rate limiting service (e.g., Upstash, Redis).

---

### 3. Missing `deletedAt` Check in Password Reset Flow
**Location:** [web/app/api/auth/forgot/route.ts#L24](web/app/api/auth/forgot/route.ts#L24)  
**Issue:** The forgot password endpoint uses `findUnique({ where: { email } })` without checking `deletedAt: null`. A soft-deleted user could still receive password reset emails.

**Code:**
```typescript
const user = await prisma.user.findUnique({ where: { email } }).catch(() => null);
```

**Fix:** Change to `findFirst` with `deletedAt: null` filter.

---

### 4. Admin Password Stored as Environment Variable (Security Risk)
**Location:** [web/lib/auth.ts#L10-L12](web/lib/auth.ts#L10-L12)  
**Issue:** Hardcoded admin credentials from environment variables. The admin password is compared directly in plain text and the hash is only created for the database record.

**Risk:** If logs expose environment variables, the admin password is compromised.

**Fix:** Store only a password hash in environment variables, or remove this feature entirely and use proper database-backed admin users.

---

### 5. No CSRF Protection on State-Changing Endpoints
**Location:** All API routes  
**Issue:** POST/PATCH/DELETE endpoints don't verify CSRF tokens. While NextAuth provides some session-based protection, additional CSRF protection is recommended.

**Fix:** Implement CSRF tokens or verify the `Origin` header matches your domain.

---

### 6. Potential XSS in Password Reset Email
**Location:** [web/lib/email.ts#L27-L32](web/lib/email.ts#L27-L32)  
**Issue:** The `resetUrl` is directly interpolated into HTML without escaping:
```typescript
html: `<p><a href="${opts.resetUrl}">${opts.resetUrl}</a></p>`
```

If a malicious URL is somehow injected, it could lead to XSS.

**Fix:** Escape HTML entities in the template.

---

### 7. Stripe Webhook Missing Event Signature Validation Logging
**Location:** [web/app/api/billing/webhook/route.ts](web/app/api/billing/webhook/route.ts)  
**Issue:** When webhook signature validation fails, there's no logging to help debug issues:
```typescript
} catch {
  return NextResponse.json({ ok: false }, { status: 400 });
}
```

**Fix:** Log the error (without exposing secrets) for debugging.

---

## 🟡 MEDIUM PRIORITY (Code Quality & Reliability)

### 8. Inconsistent Error Handling in JSON Parsing
**Location:** Multiple API routes  
**Issue:** Some routes use `.catch(() => null)` for JSON parsing, while the register route doesn't:

```typescript
// Uses catch - good
const raw = await req.json().catch(() => null);

// No catch - can throw unhandled error
const raw = await req.json();  // register route
```

**Fix:** Use consistent error handling with `.catch(() => null)` pattern everywhere.

---

### 9. Missing Cascade Delete for Soft-Deleted Applications
**Location:** API routes for notes, tasks, contacts, attachment-links  
**Issue:** When an application is soft-deleted, its related notes/tasks/contacts/links remain active. Users could still access orphaned items through direct API calls.

**Fix:** Either cascade soft-delete to related items, or add application `deletedAt` check when fetching child items.

---

### 10. Missing Transaction for Application Delete
**Location:** [web/app/api/applications/[id]/route.ts#L61-L65](web/app/api/applications/[id]/route.ts#L61-L65)  
**Issue:** Deleting an application should also soft-delete related notes/tasks/contacts/links atomically.

**Fix:** Wrap in a Prisma transaction.

---

### 11. No Pagination on Dashboard Query
**Location:** [web/app/api/dashboard/route.ts#L17-L20](web/app/api/dashboard/route.ts#L17-L20)  
**Issue:** Fetches ALL applications for a user into memory:
```typescript
const apps = await prisma.jobApplication.findMany({
  where: { userId, deletedAt: null },
  select: { stage: true, createdAt: true }
});
```

**Risk:** For users with thousands of applications, this could cause memory issues.

**Fix:** Use database aggregation queries instead of loading all records.

---

### 12. `any` Type Usage in Prisma Queries
**Location:** Multiple files  
**Issue:** `where` clauses use `any` type:
```typescript
const where: any = { userId, deletedAt: null };
```

**Fix:** Create proper typed interfaces for query filters.

---

### 13. Missing Index for Tags Search
**Location:** [prisma/schema.prisma](prisma/schema.prisma)  
**Issue:** The `tags` field is queried with `hasSome` but has no GIN index for efficient array searches.

**Fix:** Add a GIN index: `@@index([tags], type: Gin)` (PostgreSQL-specific).

---

### 14. Environment Variable Validation Not Used Everywhere
**Location:** [web/lib/env.ts](web/lib/env.ts)  
**Issue:** The `env.ts` file validates environment variables, but it's not imported anywhere. Variables are accessed directly via `process.env` throughout the codebase.

**Fix:** Import and use the validated `env` object consistently.

---

### 15. Duplicate Query Schema Definitions
**Location:** Multiple route files  
**Issue:** `listQuerySchema` is defined identically in:
- `web/app/api/notes/route.ts`
- `web/app/api/tasks/route.ts`
- `web/app/api/contacts/route.ts`
- `web/app/api/attachment-links/route.ts`

**Fix:** Move to a shared validators file.

---

### 16. CSP Policy is Too Permissive
**Location:** [web/middleware.ts#L14-L17](web/middleware.ts#L14-L17)  
**Issue:** The Content Security Policy allows `'unsafe-eval'` and `'unsafe-inline'`:
```typescript
script-src 'self' 'unsafe-eval' 'unsafe-inline';
```

**Risk:** Weakens XSS protection.

**Fix:** Use nonces for inline scripts and remove `unsafe-eval` if possible.

---

### 17. No Input Sanitization on Search Query
**Location:** [web/app/api/applications/route.ts#L46-L51](web/app/api/applications/route.ts#L46-L51)  
**Issue:** The search query `q` is passed directly to Prisma's `contains`:
```typescript
{ company: { contains: q, mode: "insensitive" } }
```

While Prisma protects against SQL injection, special characters could cause unexpected behavior.

**Fix:** Sanitize or escape special regex/search characters.

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

| Priority | Count |
|----------|-------|
| 🔴 High   | 7     |
| 🟡 Medium | 10    |
| 🟢 Low    | 23    |
| **Total** | **40** |

---

## Recommended Order of Fixing

1. **Security issues first (1-7)**
2. **Data integrity issues (8-11)**
3. **Code quality issues (12-17)**
4. **Everything else in order of impact**

Would you like to start addressing these issues one by one?
