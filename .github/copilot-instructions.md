# Copilot Instructions for Mini-SaaS-Job-Tracker

## Architecture Overview

**Next.js 14 App Router** job application tracker with multi-tenant data isolation, Stripe billing, and audit logging.

**Stack:** Next.js 14 + TypeScript + Prisma (PostgreSQL) + NextAuth + Tailwind + Zod + Stripe

### Key Structural Decisions
- **Project structure:** Next.js code in `web/`, with pages at `web/app/` and API at `web/app/api/`
- **Prisma schema:** Located at `prisma/schema.prisma` (root level, not in `web/`)
- **Soft deletes:** All models use `deletedAt` field – never hard delete records
- **Multi-tenant isolation:** Every query MUST filter by `userId` AND `deletedAt: null`
- **Server Components default:** Only use `"use client"` for forms and interactivity

## Data Model

```
User (plan, stripe fields)
  ├── JobApplication[]
  │     ├── Note[]
  │     ├── Task[]
  │     ├── Contact[]
  │     └── AttachmentLink[]
  ├── PasswordResetToken[]
  └── AuditLog[]
```

**Enums:**
- `ApplicationStage`: SAVED | APPLIED | INTERVIEW | OFFER | REJECTED  
- `TaskStatus`: OPEN | DONE
- `Plan`: FREE | PRO
- `AuditAction`: AUTH_LOGIN | AUTH_LOGOUT | AUTH_PASSWORD_RESET | APPLICATION_CREATED | APPLICATION_UPDATED | APPLICATION_DELETED | NOTE_CREATED | NOTE_UPDATED | NOTE_DELETED | TASK_CREATED | TASK_UPDATED | TASK_DELETED | CONTACT_CREATED | CONTACT_UPDATED | CONTACT_DELETED | LINK_CREATED | LINK_UPDATED | LINK_DELETED | EXPORT_CSV | BILLING_UPGRADED | BILLING_DOWNGRADED

## API Routes

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/applications` | GET, POST | List/create applications |
| `/api/applications/[id]` | GET, PATCH, DELETE | Single application CRUD |
| `/api/applications/export` | GET | CSV export (Pro only) |
| `/api/notes` | GET, POST, PATCH, DELETE | Notes CRUD (query param: `id`) |
| `/api/tasks` | GET, POST, PATCH, DELETE | Tasks CRUD (query param: `id`) |
| `/api/contacts` | GET, POST, PATCH, DELETE | Contacts CRUD |
| `/api/attachment-links` | GET, POST, PATCH, DELETE | Attachment links CRUD |
| `/api/auth/*` | NextAuth routes | Login, register, session |
| `/api/billing/webhook` | POST | Stripe webhook handler |
| `/api/account/*` | Various | Account management |
| `/api/dashboard` | GET | Dashboard stats |
| `/api/me` | GET | Current user info |

## API Route Pattern

All routes follow this structure:

```typescript
import { requireUserOr401 } from "@/lib/auth";
import { jsonError, zodToDetails } from "@/lib/errors";
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const { userId, error } = await requireUserOr401();
  if (error) return error;

  const parsed = mySchema.safeParse(await req.json());
  if (!parsed.success) return jsonError(400, "VALIDATION_ERROR", "...", zodToDetails(parsed.error));

  const item = await prisma.model.create({ data: { userId, ...parsed.data } });
  
  // Always audit mutations
  await audit(req, userId, AuditAction.MODEL_CREATED, { entity: "Model", entityId: item.id });
  
  return NextResponse.json({ item }, { status: 201 });
}
```

**Dynamic routes (Next.js 14+):** Use async params pattern:
```typescript
type RouteContext = { params: Promise<{ id: string }> };
export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id } = await ctx.params;
  // ...
}
```

## Plan Gating Pattern

Use for Pro-only features or free tier limits:

```typescript
import { getUserPlan, isPro, LIMITS } from "@/lib/plan";

const plan = await getUserPlan(userId);
if (!isPro(plan)) {
  const count = await prisma.jobApplication.count({ where: { userId, deletedAt: null } });
  if (count >= LIMITS.FREE_MAX_APPLICATIONS) {
    return jsonError(403, "PLAN_LIMIT", `Free plan limit reached (${LIMITS.FREE_MAX_APPLICATIONS}). Upgrade to Pro.`);
  }
}
```

**Limits:** FREE_MAX_APPLICATIONS = 200, CSV export = Pro only

## Audit Logging Pattern

All mutations MUST be audited:

```typescript
import { AuditAction } from "@prisma/client";
import { audit } from "@/lib/audit";

// After create/update/delete:
await audit(req, userId, AuditAction.NOTE_CREATED, { entity: "Note", entityId: created.id });
await audit(req, userId, AuditAction.NOTE_UPDATED, { entity: "Note", entityId: updated.id });
await audit(req, userId, AuditAction.NOTE_DELETED, { entity: "Note", entityId: id });
```

## Validation

- Zod schemas in `web/lib/validators/` for all input validation
- Validators: `applications.ts`, `notes.ts`, `tasks.ts`, `contacts.ts`, `attachmentLinks.ts`, `passwordReset.ts`
- Separate base schema from refinements when needing `.partial()` for updates
- Use `zodToDetails(error)` to format Zod errors for API responses

## Authentication

- NextAuth with JWT strategy + credentials provider
- `requireUserOr401()` helper returns `{ userId, error }` – check error first
- Password hashing: bcryptjs with cost factor 12
- Password reset via `PasswordResetToken` model

## Billing (Stripe)

- `web/lib/stripe.ts` - Stripe client initialization
- `web/app/api/billing/webhook/route.ts` - Handles subscription events
- User fields: `plan`, `stripeCustomerId`, `stripeSubscriptionId`, `planUpdatedAt`
- Events handled: `checkout.session.completed` (upgrade), `customer.subscription.deleted` (downgrade)

## Development Commands

```bash
cd web                          # REQUIRED: All commands from web/ directory
npm run dev                     # Dev server at localhost:3000
npm run build                   # Production build
npm run prisma:generate         # Regenerate client after schema changes
npm run prisma:migrate          # Create and apply migrations
npm run prisma:studio           # Database GUI
npm run prisma:seed             # Seed database with demo data
```

## Environment Variables (`.env` in web/)

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/jobtracker
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Component Patterns

- **Client components:** `"use client"` directive, fetch via API routes
- **Forms:** See `web/components/ApplicationForm.tsx` for controlled inputs + validation feedback
- **Panels:** `NotesPanel.tsx` and `TasksPanel.tsx` for CRUD within detail pages
- **Tables:** `DataTable.tsx` for sortable data display
- **Filters:** `FiltersBar.tsx` for search/filter controls
- **Imports:** Use `@/` alias for absolute imports from `web/` root

## Lib Modules

| Module | Purpose |
|--------|---------|
| `auth.ts` | NextAuth config, `requireUserOr401()` helper |
| `db.ts` | Prisma client singleton |
| `errors.ts` | `jsonError()`, `zodToDetails()` helpers |
| `plan.ts` | `getUserPlan()`, `isPro()`, `LIMITS` |
| `audit.ts` | `audit()` function for logging actions |
| `stripe.ts` | `getStripe()` Stripe client |
| `rateLimit.ts` | Rate limiting utilities, `getClientIp()` |
| `pagination.ts` | Pagination schema and helpers |
| `email.ts` | Email sending utilities |
| `env.ts` | Environment variable validation |

## Critical Reminders

1. **Filter by userId** – Every Prisma query must scope to authenticated user
2. **Filter by deletedAt: null** – Soft-deleted records exist, filter them out
3. **Audit all mutations** – Use `audit()` after every create/update/delete
4. **Check plan limits** – Gate Pro features and enforce free tier limits
5. **Run from `web/`** – npm commands only work from the `web/` subdirectory  
6. **Regenerate Prisma** – After schema changes: `npm run prisma:generate`
7. **Async params** – Next.js 14 route handlers use `Promise<{ id: string }>` for params
