# Job Tracker Pro - Future Tasks Roadmap
**Created:** February 2, 2026  
**Last Updated:** February 2, 2026  
**Current Status:** 403 tests passing, Grade A (92/100)

---

## 📋 Task Categories

| Category | Tasks | Priority |
|----------|-------|----------|
| [Testing](#-testing) | 12 | Mixed |
| [Refactoring](#-refactoring) | 8 | Medium |
| [Features](#-new-features) | 15 | Low-High |
| [Performance](#-performance) | 6 | Medium |
| [Security](#-security) | 5 | High |
| [DevOps](#-devops--ci) | 7 | Medium |
| [Documentation](#-documentation) | 5 | Low |
| [Upgrades](#-dependency-upgrades) | 8 | High |

---

## 🧪 Testing

### Sprint-Ready (Small Effort)

| # | Task | Priority | Effort | Files |
|---|------|----------|--------|-------|
| T1 | Add CommandPalette component tests | Medium | 2h | `CommandPalette.tsx` |
| T2 | Add KanbanBoard component tests | Medium | 3h | `KanbanBoard.tsx` |
| T3 | Add InterviewCalendar component tests | Medium | 2h | `InterviewCalendar.tsx` |
| T4 | Add TagCloud component tests | Low | 1h | `TagCloud.tsx` |
| T5 | Add MobileNav component tests | Low | 1h | `MobileNav.tsx`, `MobileBottomNav.tsx` |
| T6 | Add TimelinePanel component tests | Medium | 2h | `TimelinePanel.tsx` |

### E2E Testing

| # | Task | Priority | Effort | Notes |
|---|------|----------|--------|-------|
| T7 | Add E2E tests to GitHub Actions CI | High | 2h | Playwright workflow |
| T8 | Add E2E billing flow tests | Medium | 3h | Stripe test mode |
| T9 | Add E2E import/export tests | Medium | 2h | CSV handling |
| T10 | Add mobile viewport E2E tests | Low | 2h | Responsive testing |
| T11 | Add accessibility E2E tests | Medium | 3h | axe-playwright |
| T12 | Set up visual regression testing | Low | 4h | Playwright screenshots |

---

## 🔧 Refactoring

### Code Quality

| # | Task | Priority | Effort | Description |
|---|------|----------|--------|-------------|
| R1 | Create generic `CrudPanel<T>` component | Medium | 4h | Reduce 70% duplication in NotesPanel, TasksPanel, ContactsPanel, AttachmentLinksPanel, InterviewsPanel |
| R2 | Extract form validation hooks | Low | 2h | `useFormValidation(schema)` hook |
| R3 | Create shared API response types | Medium | 2h | `ApiResponse<T>`, `PaginatedResponse<T>` |
| R4 | Consolidate date formatting utilities | Low | 1h | Single `formatDate()` with options |
| R5 | Extract loading skeleton components | Low | 2h | Reusable skeleton patterns |
| R6 | Create `useOptimisticUpdate` hook | Medium | 3h | Shared optimistic UI pattern |
| R7 | Split large API routes into services | Medium | 4h | `ApplicationService`, `InterviewService` |
| R8 | Create form field components | Low | 3h | `FormInput`, `FormSelect`, `FormTextarea` |

---

## ✨ New Features

### High Priority

| # | Task | Priority | Effort | Description |
|---|------|----------|--------|-------------|
| F1 | Email notifications for interviews | High | 6h | Send reminders before scheduled interviews |
| F2 | Bulk edit applications | High | 4h | Select multiple, change stage/tags |
| F3 | Application templates | Medium | 4h | Save and reuse common application data |
| F4 | Advanced search with filters | High | 5h | Date range, salary range, multiple tags |

### Medium Priority

| # | Task | Priority | Effort | Description |
|---|------|----------|--------|-------------|
| F5 | Dashboard customization | Medium | 6h | Drag-and-drop widget layout |
| F6 | Application comparison view | Medium | 4h | Side-by-side offer comparison |
| F7 | Interview preparation checklists | Medium | 3h | Pre-interview task templates |
| F8 | Salary negotiation tracker | Medium | 4h | Track offer iterations |
| F9 | Contact relationship mapping | Medium | 5h | Visualize referral chains |
| F10 | Calendar integration (Google/Outlook) | Medium | 8h | Sync interviews externally |

### Low Priority (Nice to Have)

| # | Task | Priority | Effort | Description |
|---|------|----------|--------|-------------|
| F11 | Browser extension for job capture | Low | 12h | Capture from LinkedIn, Indeed |
| F12 | AI cover letter generator | Low | 8h | OpenAI integration |
| F13 | Company research integration | Low | 6h | Glassdoor/LinkedIn data |
| F14 | Job board aggregator | Low | 10h | Pull from multiple sources |
| F15 | Team/shared applications (Pro) | Low | 15h | Multi-user collaboration |

---

## ⚡ Performance

| # | Task | Priority | Effort | Description |
|---|------|----------|--------|-------------|
| P1 | Implement virtual scrolling for large lists | Medium | 4h | `@tanstack/react-virtual` |
| P2 | Add Redis caching layer | Medium | 6h | Cache frequent queries |
| P3 | Optimize Prisma queries with `select` | Medium | 3h | Reduce payload sizes |
| P4 | Lazy load dashboard widgets | Low | 2h | Progressive loading |
| P5 | Image optimization for attachments | Low | 3h | Next.js Image component |
| P6 | Add response compression | Low | 1h | gzip/brotli middleware |

---

## 🔒 Security

| # | Task | Priority | Effort | Description |
|---|------|----------|--------|-------------|
| S1 | Add two-factor authentication | High | 8h | TOTP with authenticator apps |
| S2 | Implement session management | High | 4h | View/revoke active sessions |
| S3 | Add security headers audit | Medium | 2h | OWASP header checklist |
| S4 | Rate limiting per endpoint | Medium | 3h | Granular rate limits |
| S5 | Add login attempt throttling | High | 2h | Prevent brute force |

---

## 🚀 DevOps / CI

| # | Task | Priority | Effort | Description |
|---|------|----------|--------|-------------|
| D1 | Add E2E tests to CI pipeline | High | 2h | Playwright in GitHub Actions |
| D2 | Set up staging environment | Medium | 4h | Preview deployments |
| D3 | Add database backup automation | High | 3h | Scheduled pg_dump |
| D4 | Configure error alerting | Medium | 2h | Sentry Slack integration |
| D5 | Add performance monitoring | Medium | 3h | Web Vitals tracking |
| D6 | Create Docker Compose for local dev | Low | 2h | One-command setup |
| D7 | Add semantic versioning | Low | 2h | Automated changelog |

---

## 📚 Documentation

| # | Task | Priority | Effort | Description |
|---|------|----------|--------|-------------|
| DOC1 | Create API documentation site | Medium | 4h | OpenAPI/Swagger docs |
| DOC2 | Add component Storybook | Low | 6h | Interactive component docs |
| DOC3 | Write deployment guide | Medium | 2h | Production setup steps |
| DOC4 | Create contributor guidelines | Low | 2h | CONTRIBUTING.md |
| DOC5 | Add architecture decision records | Low | 3h | ADR documents |

---

## 📦 Dependency Upgrades

### Breaking Changes (Requires Migration)

| # | Package | Current | Latest | Effort | Notes |
|---|---------|---------|--------|--------|-------|
| U1 | Next.js | 14.2.35 | 16.x | 8h | App Router changes, new features |
| U2 | React | 18.3.1 | 19.x | 4h | New hooks, concurrent features |
| U3 | Prisma | 5.22.0 | 7.x | 6h | Schema changes, new features |
| U4 | Tailwind CSS | 3.4.19 | 4.x | 4h | Config format changes |
| U5 | Vitest | 2.1.9 | 4.x | 2h | API changes |
| U6 | ESLint | 8.57.1 | 9.x | 3h | Flat config migration |
| U7 | Zod | 3.25.76 | 4.x | 2h | API changes |
| U8 | bcryptjs | 2.4.3 | 3.x | 1h | Minor API changes |

### Recommended Upgrade Order
1. **Vitest 4** (isolated, low risk)
2. **ESLint 9** (dev only)
3. **Zod 4** (validation layer)
4. **bcryptjs 3** (security patch)
5. **React 19 + Next.js 16** (together)
6. **Prisma 7** (after Next.js stable)
7. **Tailwind 4** (last, most visual changes)

---

## 🎯 Suggested Sprint Plan

### Sprint 15: Test Coverage Boost
- [ ] T1: CommandPalette tests
- [ ] T2: KanbanBoard tests  
- [ ] T3: InterviewCalendar tests
- [ ] T7: E2E in GitHub Actions
- **Goal:** 430+ tests

### Sprint 16: Panel Abstraction
- [ ] R1: Create CrudPanel<T>
- [ ] R6: useOptimisticUpdate hook
- **Goal:** Reduce code duplication by 50%

### Sprint 17: Security Hardening
- [ ] S1: Two-factor authentication
- [ ] S5: Login attempt throttling
- [ ] S2: Session management
- **Goal:** Enterprise-ready auth

### Sprint 18: Dependency Upgrades (Phase 1)
- [ ] U5: Vitest 4
- [ ] U6: ESLint 9
- [ ] U7: Zod 4
- **Goal:** Dev tooling modernized

### Sprint 19: Feature Sprint
- [ ] F1: Email notifications
- [ ] F2: Bulk edit applications
- **Goal:** Top requested features

### Sprint 20: Performance & Monitoring
- [ ] P1: Virtual scrolling
- [ ] D4: Error alerting
- [ ] D5: Performance monitoring
- **Goal:** Production observability

---

## 📊 Progress Tracking

### Completed Sprints
| Sprint | Focus | Tests | Date |
|--------|-------|-------|------|
| 1-8 | Foundation | 355 | Jan 2026 |
| 9 | Logging + Prettier + Hooks | 355 | Feb 2026 |
| 10 | Kanban A11y | 355 | Feb 2026 |
| 11 | Security + A11y | 355 | Feb 2026 |
| 12 | Types + Bundle | 355 | Feb 2026 |
| 13 | Type Safety + Tests | 391 | Feb 2026 |
| 14 | Warnings + ErrorBoundary | 403 | Feb 2026 |

### Metrics Goals
| Metric | Current | Target |
|--------|---------|--------|
| Unit Tests | 403 | 500+ |
| E2E Tests | 6 specs | 15+ specs |
| Test Coverage | ~70% | 85%+ |
| Bundle Size | 87.7kB shared | <80kB |
| Lighthouse Score | ~85 | 95+ |

---

## 🏷️ Labels Reference

- 🔴 **Critical** - Security/data loss risk
- 🟠 **High** - Important for production
- 🟡 **Medium** - Good to have
- 🟢 **Low** - Nice to have
- 🔵 **Enhancement** - New feature
- ⚪ **Chore** - Maintenance

---

*Last reviewed: Sprint 14 complete*
