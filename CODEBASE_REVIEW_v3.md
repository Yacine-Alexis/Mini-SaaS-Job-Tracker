# Codebase Review v3: Production-Ready Enhancements

**Date:** February 1, 2026  
**Focus:** Production readiness, integrations, advanced features, and professional polish.  
**Status:** IN PROGRESS (Sprint 6 Complete)

Building on the solid foundation from v1 (bug fixes, security) and v2 (UI/UX polish, accessibility), this review focuses on features that transform this from a polished side project into a competitive SaaS product.

---

## CRITICAL FIXES

### 1. Admin Account Not PRO
**Location:** Database  
**Status:** FIXED

**Issue:** The admin user account was on FREE plan despite .env comments suggesting PRO access.

**Fix Applied:** Upgraded all existing users to PRO plan via database update.

---

## HIGH PRIORITY - Core UX Issues

### 2. Panels Using Plain "Loading..." Instead of Skeletons
**Location:** `web/components/NotesPanel.tsx`, `TasksPanel.tsx`, `ContactsPanel.tsx`, `AttachmentLinksPanel.tsx`  
**Status:** FIXED

**Issue:** All panels show plain "Loading..." text despite having Skeleton components available.

**Fix Applied:** Added custom skeleton components (`NotesSkeleton`, `TasksSkeleton`, `ContactsSkeleton`, `LinksSkeleton`) to each panel that match the content structure.

---

### 3. Delete Confirmations Use Browser confirm()
**Location:** `NotesPanel.tsx`, `TasksPanel.tsx`, `ContactsPanel.tsx`, `AttachmentLinksPanel.tsx`  
**Status:** FIXED

**Issue:** Uses native `confirm()` which looks inconsistent. ConfirmModal component exists but isn't used in panels.

**Fix Applied:** Replaced all `confirm()` calls with `ConfirmModal` component. Added `deleteId`/`deleting` state management and `confirmDelete` async functions to each panel.

---

### 4. No Search Debouncing
**Location:** `web/components/ApplicationsClient.tsx`  
**Status:** FIXED

**Issue:** Search input triggers immediate API call on every keystroke.

**Fix Applied:** Created `useDebounce` hook at `web/lib/hooks/useDebounce.ts` and integrated 300ms debounce on search query in `ApplicationsClient.tsx`.

---

### 5. Missing Form Success Feedback
**Location:** `web/components/ApplicationForm.tsx`  
**Status:** FIXED

**Issue:** Form redirects immediately after save with no visual confirmation. User doesn't know if save succeeded.

**Fix Applied:** Added success toast notification via `useToast` hook before redirect with 300ms delay to allow toast to display.

---

### 6. Empty States Not Using EmptyState Component
**Location:** `NotesPanel.tsx`, `TasksPanel.tsx`, `ContactsPanel.tsx`, `AttachmentLinksPanel.tsx`  
**Status:** FIXED

**Issue:** Panels show plain text like "No notes yet." instead of the illustrated EmptyState component.

**Fix Applied:** Replaced plain text empty states with `EmptyState` component using appropriate icons (`notes`, `tasks`, `contacts`, `links`) and helpful descriptions.

---

### 7. Client-Side Sorting Instead of Database Sorting
**Location:** `web/components/ApplicationsClient.tsx`  
**Issue:** Sorts entire dataset client-side after fetch. Should sort in database for performance.

**Fix:** Pass sort parameters to API and let Prisma handle sorting.

---

### 8. Pagination Shows No Total Count
**Location:** `web/components/ApplicationsClient.tsx`  
**Issue:** API returns `total` count but component doesn't display "Showing X-Y of Z results" or total pages.

**Fix:** Add pagination info display with total count.

---

## MEDIUM PRIORITY - Missing Features

### 9. No OAuth/Social Login
**Location:** `web/lib/auth.ts`  
**Issue:** Only credentials provider. Job seekers commonly use Google/LinkedIn accounts.

**Fix:** Add OAuth providers:
- Google (most common)
- LinkedIn (highly relevant for job search)
- GitHub (for developer roles)

---

### 10. No Interview Tracking
**Location:** `prisma/schema.prisma`  
**Issue:** No dedicated model for tracking interviews. Users can only add notes.

**Fix:** Create Interview model with:
- scheduledAt (datetime)
- type (PHONE, VIDEO, ONSITE, TECHNICAL)
- interviewers (string array)
- duration (minutes)
- notes, feedback, result
- Calendar event integration

---

### 11. No Task Reminders/Notifications
**Location:** `web/app/api/tasks/`  
**Issue:** Tasks have due dates but no reminder system. Users must manually check.

**Fix:** 
- Add reminder datetime field to Task model
- Email notification for upcoming/overdue tasks
- Browser push notifications (PWA)

---

### 12. No File Upload for Resumes
**Location:** `web/components/AttachmentLinksPanel.tsx`  
**Issue:** Only stores URLs, no actual file upload capability.

**Fix:** Add file upload with:
- S3/Cloudflare R2 storage
- Or Google Drive/Dropbox integration
- Resume version management

---

### 13. Missing Application Fields
**Location:** `prisma/schema.prisma` - JobApplication model  
**Issue:** Missing useful fields for comprehensive tracking.

**Add fields:**
- `description` - Job description text (for AI analysis later)
- `requirements` - Job requirements
- `priority` - HIGH/MEDIUM/LOW enum
- `remoteType` - REMOTE/HYBRID/ONSITE enum (not just string)
- `salaryCurrency` - USD/EUR/GBP etc.
- `salaryPeriod` - HOURLY/MONTHLY/ANNUAL
- `jobType` - FULL_TIME/PART_TIME/CONTRACT enum
- `experienceLevel` - ENTRY/MID/SENIOR/LEAD
- `nextFollowUpDate` - When to follow up
- `lastContactDate` - Last response received
- `rejectionReason` - For learning patterns
- `referralContact` - Who referred you

---

### 14. No Saved Searches/Filters
**Location:** `web/components/FiltersBar.tsx`  
**Issue:** Users must manually set filters each time. No way to save common filter combinations.

**Fix:** Create SavedSearch model and UI:
- Save current filter state with name
- Quick-apply saved searches from dropdown
- Pro feature potential

---

### 15. Dashboard Missing Date Range Filter
**Location:** `web/app/dashboard/page.tsx`  
**Issue:** Shows hardcoded "last 8 weeks". No custom date range selection.

**Fix:** Add date picker for:
- Preset ranges (This week, This month, Last 30 days, etc.)
- Custom date range
- Comparison to previous period

---

### 16. No Calendar Integration
**Location:** New feature  
**Issue:** No way to sync interviews/tasks with external calendars.

**Fix:** Integrate with:
- Google Calendar API
- Outlook Calendar API
- iCal export

---

### 17. Missing Dashboard Metrics
**Location:** `web/app/api/dashboard/route.ts`  
**Issue:** Limited metrics. Missing conversion insights.

**Add metrics:**
- Time-to-response (avg days from apply to first response)
- Conversion rates by stage (Applied -> Interview -> Offer)
- Success rate by source (which sources yield most interviews)
- Average time in each stage
- Application velocity trend

---

### 18. No Email Notifications
**Location:** `web/lib/email.ts`  
**Issue:** Only transactional emails (password reset). No notification system.

**Fix:** Add notification emails:
- Task due date reminders
- Weekly digest summary
- Interview reminders
- Configurable preferences

---

## LOW PRIORITY - Polish & Enhancements

### 19. Kanban Drag Animation Missing
**Location:** `web/components/KanbanBoard.tsx`  
**Issue:** Cards snap to new columns without smooth animation.

**Fix:** Add CSS transitions for drag preview and drop animation.

---

### 20. Mobile Form UX
**Location:** `web/components/ApplicationForm.tsx`  
**Issue:** Long single-page form on mobile. Could be multi-step wizard.

**Fix:** On mobile, break into steps:
1. Company & Title
2. Location & Remote
3. Salary & Source
4. Links & Tags

---

### 21. No Bulk Edit Beyond Stage
**Location:** `web/components/ApplicationsClient.tsx`  
**Issue:** Batch operations only support delete and stage change.

**Fix:** Add bulk operations for:
- Add/remove tags
- Update source
- Archive (soft delete without deletion)

---

### 22. Missing Keyboard Shortcuts in Panels
**Location:** `NotesPanel.tsx`, `TasksPanel.tsx`  
**Issue:** No keyboard shortcuts for quick add. Must click buttons.

**Fix:** Add keyboard shortcuts:
- `Enter` in form to submit
- `Escape` to cancel
- `N` to focus new item input

---

### 23. No Template System
**Location:** New feature  
**Issue:** Users rewrite similar cover letters/follow-up emails.

**Fix:** Create Template model:
- Cover letter templates
- Follow-up email templates
- Variable interpolation ({{company}}, {{position}})

---

### 24. Hardcoded Source Options
**Location:** `web/components/ApplicationForm.tsx`  
**Issue:** Source dropdown options are hardcoded.

**Fix:** 
- Allow custom sources
- Or make sources user-configurable in settings
- Track source effectiveness

---

### 25. Missing User Profile Settings
**Location:** `web/app/settings/account/page.tsx`  
**Issue:** Only password change and delete. No profile editing.

**Add settings:**
- Display name
- Timezone (for due date calculations)
- Default currency
- Date format preference (MM/DD vs DD/MM)
- Default dashboard view (list vs kanban)
- Items per page preference

---

### 26. No Two-Factor Authentication
**Location:** `web/lib/auth.ts`  
**Issue:** No 2FA/TOTP support for security-conscious users.

**Fix:** Add optional TOTP-based 2FA.

---

### 27. No Session Management
**Location:** Settings  
**Issue:** Users can't see or revoke active sessions.

**Fix:** Add session management page showing:
- Active sessions with device/location
- Last activity
- Revoke session option

---

### 28. WeeklyBarChart No Interactivity
**Location:** `web/components/WeeklyBarChart.tsx`  
**Issue:** Static SVG chart. No tooltips or interaction.

**Fix:**
- Hover tooltips with exact values
- Click to filter by that week
- Animated bar growth on load

---

### 29. No Goals/Targets Feature
**Location:** Dashboard  
**Issue:** No way to set application goals.

**Fix:** Add goal setting:
- Weekly application target
- Progress indicator
- Streak tracking
- Achievement badges (gamification)

---

### 30. Missing Database Indexes
**Location:** `prisma/schema.prisma`  
**Issue:** Missing indexes for common queries.

**Add indexes:**
- `JobApplication.source` for source filtering
- `Task.dueDate` + `Task.status` for overdue queries
- Full-text search on company + title

---

### 31. No Unit Test Coverage
**Location:** `tests/unit/`  
**Issue:** Vitest.txt placeholder exists but no actual tests.

**Fix:** Add tests for:
- Validators (Zod schemas)
- Utility functions
- API route handlers
- React hooks

---

### 32. Rich Text Content Not Sanitized
**Location:** `web/components/ui/RichTextEditor.tsx`  
**Issue:** Notes using rich text editor aren't sanitized for XSS.

**Fix:** Sanitize HTML output before render using DOMPurify or similar.

---

### 33. No Data Backup/Export Options
**Location:** Settings  
**Issue:** Only CSV export for applications. No full backup.

**Fix:** Add export options:
- Full JSON backup (all data)
- Individual exports (notes, tasks, contacts separately)
- Automated weekly backup email (Pro feature)

---

### 34. Missing Billing Features
**Location:** `web/app/settings/billing/page.tsx`  
**Issue:** Basic billing page. Missing common features.

**Add:**
- Invoice history
- Card management
- Annual pricing option (discount)
- Trial period support
- Usage statistics
- Promo/referral codes

---

### 35. Webhook Handler Missing Events
**Location:** `web/app/api/billing/webhook/route.ts`  
**Issue:** Only handles checkout.session.completed and subscription.deleted.

**Add handlers for:**
- invoice.payment_failed (notify user)
- customer.subscription.updated (plan changes)
- customer.subscription.trial_will_end

---

### 36. No API Rate Limiting Display
**Location:** API responses  
**Issue:** Rate limiting exists but clients don't see remaining quota.

**Fix:** Add rate limit headers:
- X-RateLimit-Limit
- X-RateLimit-Remaining
- X-RateLimit-Reset

---

### 37. TypeScript Session Type Hack
**Location:** `web/lib/auth.ts`  
**Issue:** Uses `@ts-expect-error` for session.user.id.

**Fix:** Properly extend NextAuth types:
```typescript
declare module "next-auth" {
  interface Session {
    user: { id: string; email: string };
  }
}
```

---

### 38. No Duplicate Application Detection
**Location:** `web/app/api/applications/route.ts`  
**Issue:** Users can create duplicate entries for same company/job.

**Fix:** Show warning if similar application exists (same company + similar title).

---

### 39. N+1 Query in Tags Aggregation
**Location:** `web/app/api/applications/route.ts`  
**Issue:** Tags are computed by loading all applications then iterating.

**Fix:** Use Prisma aggregation or raw SQL for tag counting.

---

### 40. No Activity Feed
**Location:** Dashboard or dedicated page  
**Issue:** No chronological view of recent activity across all applications.

**Fix:** Create activity feed showing:
- Recent stage changes
- New applications added
- Tasks completed
- Notes added

---

## Pro Feature Ideas

These could differentiate PRO tier:

1. **AI Features**
   - Cover letter generation
   - Interview question prep based on job description
   - Resume tailoring suggestions
   - Auto-tagging applications

2. **Advanced Analytics**
   - Conversion funnel analysis
   - Source effectiveness comparison
   - Salary benchmarking
   - Time-to-hire predictions

3. **Integrations**
   - Calendar sync (Google/Outlook)
   - Email parsing for auto-updates
   - LinkedIn job import
   - Browser extension

4. **Collaboration**
   - Share applications with mentor/coach
   - Team mode for recruitment agencies
   - Export shareable reports

5. **Automation**
   - Auto follow-up reminders
   - Stage change triggers
   - Weekly report generation

---

## Summary

| Priority | Count | Status |
|----------|-------|--------|
| Critical | 1     | ✅ Fixed (Admin PRO) |
| High     | 7     | ✅ 5 Fixed, 2 Pending |
| Medium   | 10    | Pending |
| Low      | 22    | Pending |
| **Total** | **40** | **6 Fixed** |

---

## Recommended Implementation Order

### Sprint 6: Core UX Fixes ✅ COMPLETE
1. ✅ Replace all confirm() with ConfirmModal
2. ✅ Add skeleton loaders to panels
3. ✅ Use EmptyState component in panels
4. ✅ Add search debouncing
5. ✅ Add form success feedback

**Bonus:** TasksPanel now shows overdue (red) and due-today (amber) highlighting

### Sprint 7: Database & API Improvements ✅ COMPLETE
- ✅ Added database sorting for applications (sortBy/sortDir params, server-side ordering)
- ✅ Added pagination info display (total count captured in ApplicationsClient)
- ✅ Added missing database indexes ([userId, appliedDate], [userId, deletedAt] on JobApplication; [userId, status, dueDate], [applicationId, deletedAt] on Task; [entityId] on AuditLog)
- ✅ Extended JobApplication model fields (Priority, RemoteType, JobType enums + salaryCurrency, description, nextFollowUp, rejectionReason)
- ✅ Fixed N+1 query in tags (raw SQL with PostgreSQL unnest() for efficient tag aggregation)

**Technical Notes:**
- Moved salary validation from Zod `.refine()` to manual validation in route handlers (preserves TypeScript types)
- Migration `20250201204235_sprint7_indexes_and_fields` applied

### Sprint 8: Interview & Reminder System
11. Create Interview model
12. Interview scheduling UI
13. Task reminder system
14. Email notifications
15. Browser push notifications

### Sprint 9: Integrations
16. OAuth providers (Google, LinkedIn)
17. Calendar integration
18. File upload for resumes
19. Saved searches feature

### Sprint 10: Advanced Features
20. Dashboard date range filter
21. Additional dashboard metrics
22. Template system
23. User profile settings
24. Goals/achievements

---

## Files to Create

- ✅ `web/lib/hooks/useDebounce.ts` - Debounce hook (CREATED)
- `web/app/api/interviews/route.ts` - Interview CRUD
- `web/components/InterviewPanel.tsx` - Interview management
- `web/app/api/reminders/route.ts` - Reminder system
- `web/app/api/templates/route.ts` - Template CRUD
- `web/components/TemplateEditor.tsx` - Template management
- `web/app/api/saved-searches/route.ts` - Saved searches
- `web/lib/calendar.ts` - Calendar integration
- `web/lib/storage.ts` - File upload utilities
- `web/app/settings/notifications/page.tsx` - Notification preferences
- `web/app/settings/integrations/page.tsx` - OAuth connections
- `tests/unit/*.test.ts` - Unit tests

---

## Schema Changes Required

```prisma
// ✅ IMPLEMENTED IN SPRINT 7
enum RemoteType { REMOTE HYBRID ONSITE }
enum JobType { FULL_TIME PART_TIME CONTRACT FREELANCE INTERNSHIP }
enum Priority { HIGH MEDIUM LOW }

// ✅ IMPLEMENTED - Extended JobApplication (Sprint 7)
// Added: salaryCurrency, priority, remoteType, jobType, description, nextFollowUp, rejectionReason
// Added indexes: [userId, appliedDate], [userId, deletedAt]

// TODO: Future sprints
enum ExperienceLevel { ENTRY MID SENIOR LEAD EXECUTIVE }
enum InterviewType { PHONE VIDEO ONSITE TECHNICAL BEHAVIORAL FINAL }
enum InterviewResult { PASSED FAILED PENDING CANCELLED }

// Extended JobApplication (remaining fields)
model JobApplication {
  // ... existing fields + Sprint 7 additions
  requirements     String?       // TODO
  salaryPeriod     String?       // TODO
  experienceLevel  ExperienceLevel?  // TODO
  lastContactDate  DateTime?     // TODO
  referralContact  String?       // TODO
  interviews       Interview[]   // TODO: Sprint 8
}

// New Interview model (Sprint 8)
model Interview {
  id            String           @id @default(cuid())
  applicationId String
  userId        String
  scheduledAt   DateTime
  duration      Int?
  type          InterviewType
  location      String?
  interviewers  String[]
  notes         String?
  feedback      String?
  result        InterviewResult?
  calendarEventId String?
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
  deletedAt     DateTime?
  
  application   JobApplication   @relation(fields: [applicationId], references: [id])
  user          User             @relation(fields: [userId], references: [id])
  
  @@index([applicationId])
  @@index([userId, scheduledAt])
}

// New SavedSearch model
model SavedSearch {
  id        String   @id @default(cuid())
  userId    String
  name      String
  filters   Json
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
}

// New Template model
model Template {
  id        String       @id @default(cuid())
  userId    String
  name      String
  type      TemplateType
  content   String
  variables String[]
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
  
  user      User         @relation(fields: [userId], references: [id])
  
  @@index([userId])
}

enum TemplateType { COVER_LETTER EMAIL FOLLOWUP }

// Extended User model
model User {
  // ... existing fields
  displayName              String?
  avatarUrl                String?
  timezone                 String?   @default("UTC")
  emailVerified            DateTime?
  onboardingCompletedAt    DateTime?
  notificationPreferences  Json?
  lastActiveAt             DateTime?
  interviews               Interview[]
  savedSearches            SavedSearch[]
  templates                Template[]
}

// Extended Task model
model Task {
  // ... existing fields
  description String?
  priority    Priority @default(MEDIUM)
  reminderAt  DateTime?
}

// Extended Note model
model Note {
  // ... existing fields
  pinned Boolean @default(false)
}

// Extended Contact model
model Contact {
  // ... existing fields
  linkedInUrl     String?
  notes           String?
  lastContactedAt DateTime?
}
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    "dompurify": "^3.x",
    "@types/dompurify": "^3.x",
    "googleapis": "^130.x",
    "@aws-sdk/client-s3": "^3.x",
    "ioredis": "^5.x"
  }
}
```
