# Neighborhood Hub – Roadmap

A community platform for neighborhood sharing in Bulgaria.

---

## IMPORTANT: MVP Boundary

> **Capstone project (3–4 weeks):** Only v0.1 is implemented. Everything after v0.1 is product vision — do not touch until v0.1 is complete and deployed.

| Week | Focus | Status |
|------|-------|--------|
| 1 | Auth + DB schema + Monorepo setup + Deploy skeleton | ✅ done |
| 2 | Skill Listings (CRUD API + Web screens) | ✅ done |
| 3 | Skill Requests + Neighborhood Radar (map) + Admin panel | ✅ done |
| 4 | Mobile screens + Image uploads + Polish + README + 15+ commits | ✅ done |

---

## v0.1 – Module 1: Neighborhood Radar + Time & Skill Swap *(MVP – complete)*

### Neighborhood Radar (map)
- Interactive map with markers by type (skills, tools, events)
- Filter by marker type
- Click marker → item details
- **Note:** Location is neighborhood-level only (no exact address) – privacy/GDPR

### Time & Skill Swap
- Users publish skill listings (skill, category, hours/week, status)
- Session requests with date/time + format (online/offline)
- ~~Ratings and reviews~~ → removed from MVP (separate flow, edge cases)

### DB Tables (v0.1)
| Table | Description |
|-------|-------------|
| `users` | Auth + profile (id, email, password_hash, role, name, location_id) |
| `skills` | Skill listings (id, owner_id, title, category, available_hours, status) |
| `skill_requests` | Booking requests (id, user_from_id, user_to_id, skill_id, scheduled_start, status) |
| `locations` | Geo data for radar (id, lat, lng, type, city, neighborhood) |

### Web screens (v0.1)
| Screen | Route | Status |
|--------|-------|--------|
| Home / Dashboard | `/` | ✅ done |
| Register | `/register` | ✅ done |
| Login | `/login` | ✅ done |
| Forgot Password | `/forgot-password` | ✅ done |
| Reset Password | `/reset-password` | ✅ done |
| Verify Email | `/verify-email` | ✅ done |
| Skill List + Search + Filters | `/skills` | ✅ done |
| Skill Detail + Request form | `/skills/[id]` | ✅ done |
| Create Skill (with image upload) | `/skills/new` | ✅ done |
| Edit Skill | `/skills/[id]/edit` | ✅ done |
| My Requests | `/my-requests` | ✅ done |
| Profile View | `/profile` | ✅ done |
| Profile Edit (with avatar upload) | `/profile/edit` | ✅ done |
| Public User Profiles | `/users/[id]` | ✅ done |
| Admin — Users | `/admin/users` | ✅ done |
| Admin — Audit Log | `/admin/audit` | ✅ done |
| AI Chat | `/chat` | ✅ done |

### Mobile screens (v0.1)
| Screen | Status |
|--------|--------|
| Login / Register | ✅ done |
| Skill List (paginated) | ✅ done |
| Skill Detail + Request | ✅ done |
| Create Skill | ✅ done |
| Edit Skill | ✅ done |
| Request Skill | ✅ done |
| My Requests (sent/received) | ✅ done |
| My Skills | ✅ done |
| Notifications | ✅ done |
| Profile + Avatar Upload | ✅ done |
| Edit Profile | ✅ done |
| Public User Profile | ✅ done |
| AI Chat | ✅ done |
| Neighborhood Radar (map) | ✅ done |

### AI Features (v0.1 – if time allows in Week 3)
- `/api/ai/chat` – AI chat assistant (required for "Full Stack Apps with AI" course)
- `/api/ai/recommendations` – skill recommendations

---

## Production Polish Pass

The core MVP is already complete. The next phase should not add new product scope; it should raise trust, clarity, accessibility, and resilience across the existing screens and APIs.

### Current Analysis

The codebase is functionally solid, but the remaining rough edges are all production-facing:

1. Loading and empty states are still visually inconsistent across web and mobile.
2. Several mutations still lack explicit success feedback, so users may not know an action completed.
3. Destructive actions are not uniformly guarded by confirmation dialogs.
4. Error recovery is weak in a few high-traffic flows because retries are not first-class.
5. Accessibility is acceptable but not polished enough for keyboard and screen-reader confidence.
6. Date/time formatting and form validation copy still vary by screen and platform.

These are not feature gaps. They are confidence gaps.

### Must Have

1. Action feedback and recovery
- Scope: request actions, conversation actions, profile edits, skill create/edit, admin mutations
- Goal: show a clear success toast or inline confirmation after every successful mutation, and provide retry on recoverable failures
- Success: users always know whether the action completed and can recover from transient errors without a full refresh

2. Error and empty state parity
- Scope: web list/detail pages and mobile tab/detail screens
- Goal: standardize loading, empty, and error states with a shared visual language and retry affordance
- Success: every primary data screen has a visible, actionable fallback state

3. Destructive action protection
- Scope: delete conversation, delete skill, admin lock/delete actions, any irreversible mutation
- Goal: use one confirm pattern everywhere and make destructive intent explicit
- Success: no one can delete important data with a single accidental tap/click

4. Mobile error-state completeness
- Scope: profile, skills, my requests, chat, radar
- Goal: ensure every fetch state renders loading, error, and empty paths instead of falling through to blank UI
- Success: flaky mobile connectivity never produces a silent screen

### Nice to Have

1. Skeleton loaders for the highest-traffic screens
- Scope: home dashboard, skills list, profile, my requests, mobile list screens
- Goal: replace generic loading text with skeleton cards and section placeholders
- Success: the UI feels intentional instead of abruptly blank while data loads

2. Shared formatting utilities
- Scope: dates, times, status labels, meeting types, counts
- Goal: centralize date/time and enum presentation in one formatter module
- Success: less copy drift and fewer raw technical labels in the UI

3. Accessibility pass
- Scope: navigation, dropdowns, modals, request forms, notification controls
- Goal: add missing aria labels, aria-expanded, and focus management where needed
- Success: keyboard and screen-reader usage becomes predictable across the app

4. Form validation consistency
- Scope: auth, profile, skill create/edit, request form, mobile equivalents
- Goal: align field-level validation copy and submit-state behavior across platforms
- Success: users get actionable feedback before they hit submit, not only after failure

### Recommended Implementation Waves

1. Wave 1: Confidence-critical mutations
- Add success feedback for successful writes
- Add confirm dialogs to destructive actions
- Add retry actions to recoverable error states
- Fix the mobile profile error branch and any other blank-state paths

2. Wave 2: Shared UI surface polish
- Introduce skeleton loaders for the busiest screens
- Centralize empty/error/loading layouts into reusable primitives
- Normalize button, badge, and status presentation

3. Wave 3: Accessibility and content consistency
- Add aria metadata and focus handling to interactive controls and dialogs
- Standardize date/time and status formatting
- Harmonize validation messages across web and mobile

4. Wave 4: Resilience hardening
- Add soft-delete or archived-state handling where destructive UX is still risky
- Add backoff or retry caps for repeatable network failures
- Tighten fallback behavior for AI/chat and other provider-dependent flows

### Validation After Each Wave

1. Run the web build.
2. Smoke the impacted web routes and API endpoints.
3. Validate at least one happy path and one negative path.
4. Recheck the mobile screens that share the same data flow.
5. Keep commits small and feature-scoped.

### Execution Rules

1. Do not change business logic unless explicitly requested.
2. Keep API response shapes backward-compatible.
3. Prefer shared primitives over one-off fixes.
4. Exclude low-value ideas such as dark mode, WebSockets, or animation-first polish.

### Feature Quality Gate (Mandatory)

Apply this process **after every individual feature change** before commit.

1. Senior Dev Code Review
- Review only changed files in the feature scope.
- Focus on bugs, regressions, API compatibility, error handling, and maintainability.
- Output findings ordered by severity with exact file references.

2. Senior QA Validation
- Run build validation (`npm run build:web`).
- Run runtime smoke checks for impacted routes and API endpoints.
- Validate both happy-path and at least one negative-path behavior.

3. Merge/Commit Decision
- Commit only when critical/high findings are resolved.
- If medium/low findings remain, document rationale and follow-up task.

Reference playbook:

- Use docs/QA_REGRESSION_PACK.md for canonical regression IDs, evidence format, and release gate criteria.

Reusable prompt for agents (copy/paste):

"Act as a Senior Developer and perform a strict code review for this production polish change. Then act as a Senior QA and execute build + runtime smoke validation for all impacted routes/endpoints. Return: (1) Findings ordered by severity with file references, (2) Test evidence with pass/fail, (3) Final go/no-go decision for commit."

---

### Milestone Review Protocol (run after significant work)

**When to trigger** — any of the following:
- End of a session with 5 or more commits
- Before any `git push` to remote
- After completing a feature module
- Before deployment

**How to run** — type `/milestone-review` in Claude Code. This triggers a 4-role deep audit:

| Role | Focus |
|------|-------|
| Senior Architect | Architecture health, schema gaps, API consistency, scaling risks |
| Senior Tech Lead | Code quality, DRY violations, dead code, edge case bugs, technical debt |
| Senior QA | State machine correctness, race conditions, unguarded paths, regression risk |
| Docs Sync | ROADMAP alignment, AGENTS.md rule updates, CLAUDE.md Applied Learning |

**Output** — structured summary with top-3 actions before next push, and automatic updates to `docs/ROADMAP.md` Improvement Backlog for any new findings.

**Commit after review** — use message format: `chore(review): milestone review findings [date]`

---

## Top Technical Debt Priority (Parallel Track)

### Objective

Incrementally redesign client component logic where it is currently state-heavy and fetch-heavy, using TanStack Query to reduce duplicated state handling, simplify mutations, and improve data consistency.

This is a **parallel** track to MVP stabilization and must avoid aggressive rewrites.

### Explicit Non-Goals

1. Do not introduce `react-router` in Next.js or Expo apps.
2. Do not rewrite server-rendered pages that already behave well.
3. Do not run a large cross-app migration in one PR.

### Why This Track Exists

1. Repeated `loading/error/retry` logic in multiple client components.
2. Manual synchronization between list views and mutation results.
3. Higher risk of stale UI after optimistic actions and deletes.
4. Increasing maintenance cost as features expand.

### Guiding Architecture Rules

1. Use TanStack Query only in client components that benefit from caching/refetch/invalidation.
2. Keep API response contracts unchanged.
3. Prefer small, domain-scoped query keys (example: `['notifications', 'unread', userId]`).
4. Keep auth/session logic in existing auth layer; do not duplicate in query hooks.
5. Each refactor PR must include code review findings + QA evidence.

### Wave Plan (Incremental)

#### Wave A (P0) — Completed foundation

1. Add `QueryClientProvider` in web UI provider.
2. Migrate notifications and chat sidebar data loading to TanStack Query.
3. Ensure query keys are user-scoped to avoid cache bleed.

Status: ✅ Done.

#### Wave B (P0) — My Requests flow (Web) ✅ Done

- `my-requests/_hooks/use-skill-requests.ts` — `useQuery` with stable keys
- `my-requests/_hooks/use-request-actions.ts` — `useMutation` with `invalidateQueries`
- Page split into focused components under `_components/`

#### Wave C (P1) — Skills list/search/filter (Web) ✅ Done

- `skills/_hooks/use-skills-list.ts` — `useQuery` with category/location/search/page keys
- Filters drive query key; pagination handled in hook

#### Wave D (P1) — Mobile high-churn screens ✅ Done

- `my-requests.tsx` — `useQuery` for requests list
- `notifications.tsx` — `useQuery` + `useMutation` for mark-read
- All module list/detail screens use `useQuery` from TanStack

#### Wave E (P2) — Shared query conventions and guardrails ✅ Done

- `src/lib/query-keys.ts` — central registry for all TanStack Query key namespaces
- `web-ui-provider.tsx` — default `staleTime: 15_000`, `retry: 1`, `refetchOnWindowFocus: false`
- Convention documented in AGENTS.md

### Refactor Quality Gates (Mandatory per Wave)

1. Senior code review findings first (ordered by severity).
2. Run `npm run --prefix packages/nextjs lint`.
3. Run smoke checks for affected flows:
	- `npm run smoke:web`
	- `npm run smoke:auth`
	- `npm run smoke:auth:browser`
4. For state-machine-sensitive changes, run specialized transition smoke tests.
5. Commit only when critical/high issues are resolved.

### Delivery Cadence

1. One domain at a time (no broad rewrites).
2. Small commits with reversible scope.
3. Keep this track in top technical debt priority until Waves B and C are completed.

---

## v0.2 – Module 2: Neighborhood Tool Library *(✅ Done)*

- Share tools and household items (drill, ladder, lawnmower, etc.)
- Status: available / in use / on loan
- Reservations with date/time
- **DB:** `tools` + `tool_reservations`

---

## v0.3 – Module 3: Neighborhood Events *(✅ Done)*

- Community events + charity initiatives (charity is a subtype of event)
- RSVP / attendance registration
- **DB:** `events` + `event_attendees` (with field `event_type: 'community' | 'charity' | 'meetup'`)
- **Note:** Charity is not a separate module — use `event_type: 'charity'`

---

## v0.4 – Module 4: Neighborhood Food Sharing *(✅ Done)*

- Share surplus food (home-cooked, seasonal produce, etc.)
- Status: available / reserved / picked_up
- **DB:** `food_shares` + `food_reservations`

---

## v0.5 – Module 5: Neighborhood Chat / Feed *(✅ Done)*

- Social feed of neighborhood activities
- Direct messages or group chats per neighborhood

---

## Authorization Layer Audit (2026-05-03)

> Senior RLS / Authorization Specialist review of all server-side access control policies.
> Note: Project uses Neon PostgreSQL + Drizzle ORM — authorization is enforced at the application layer (API routes), not via database-level RLS.

### What was audited
- `src/lib/middleware.ts` — `requireAuth` / `requireAdmin` middleware
- All 23 API route groups for ownership checks, role checks, and data scoping
- `src/lib/queries/` — shared query functions for user scoping and soft-delete filtering

### Overall verdict: GOOD — no exploitable data leakage found

All protected mutations check ownership before executing. All user-specific data (notifications, profile, conversations, reservations) is properly scoped to `user.sub`. Admin endpoints are gated by `requireAdmin`. Upload has MIME-type + magic byte validation.

### Issues found and corrected

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | **FIXED** | `PUT /api/tools/[id]` — ownership was checked at application level but not included in the UPDATE `WHERE` clause. Risk: defense-in-depth gap (not exploitable without an ownership-transfer endpoint, which doesn't exist). Fixed to match `skills` route pattern: ownership embedded in both the `findFirst` query and the `UPDATE WHERE`. | ✅ Fixed |
| 2 | **FALSE POSITIVE** | Agent flagged food reservations GET as "leak". Actual code on line 56 correctly filters non-owners in memory (`rows.filter(r => r.requesterId === user.sub)`). Not a security issue — but is a performance issue (DB returns all rows, then filters client-side). | ⚠️ Performance only — see P3 backlog |
| 3 | **LOW** | `queryFoodReservations()` query function does not include `isNull(foodShares.deletedAt)` in isolation. Safe in practice because all callers pre-validate existence. Should be self-consistent regardless. | 📋 P3 backlog |
| 4 | **MEDIUM** | Event RSVP capacity check (line 37–44) and the INSERT (line 63) are not atomic. Two concurrent requests can both pass the `attending >= maxCapacity` check before either inserts, leading to overbooking. | 📋 P2 backlog |
| 5 | **MEDIUM** | Food reservation quantity check and INSERT are not atomic. Same race as #4 — concurrent requests can exceed `foodShare.quantity`. | 📋 P2 backlog |

### What passed cleanly ✅
- Skill requests: only owner can approve/reject; only requester can complete; both can cancel — verified
- Tool reservations: owner approves/rejects; borrower returns; terminal states enforced — verified
- Food reservation PATCH: role-based state machine with correct participant checks — verified
- Conversations: participant validation on both GET and POST messages — verified
- Notifications GET: scoped to `user.sub` only — verified
- Profile GET: returns only authenticated user's own profile — verified
- Admin endpoints: `requireAdmin` gates all admin routes; self-demotion prevented; last-admin guard present — verified
- Upload: MIME type whitelist + magic byte check + 5MB limit + UUID filename — verified
- Ratings: self-rating blocked; duplicate rating blocked via DB unique constraint — verified

---

## 9-Role Audit (2026-05-03)

> Full codebase audit conducted from 9 professional perspectives. Findings fed into the Improvement Backlog below.

### 1. Product Owner / Business Analyst
**Status:** MVP feature-complete across all 5 modules. Core business flows work end-to-end.

**Gaps found:**
- Event creator is not automatically registered as first attendee — breaks the "organizer participates" mental model
- No search/filter on Events and Food lists — unusable at scale (skills has search, others don't)
- Ratings API and DB exist but are invisible to users — built infrastructure with no UI payoff
- Food share creation has no safety acknowledgment — legal and trust gap

### 2. Solution Architect
**Status:** Monorepo is well-structured. Drizzle + Neon + Next.js + Expo is a coherent, modern stack.

**Gaps found:**
- 5+ API routes call `fetch('/api/...')` to themselves internally — circular dependency risk and unnecessary HTTP overhead
- Types for shared domain objects (`MapMarker`, `FoodShare`) are duplicated between web and mobile — drift risk
- 3 DB columns used in frequent queries lack indexes (`available_until`, `starts_at`, `deadline`)
- `event_attendees` and `drive_pledges` missing `updatedAt` — breaks future audit/analytics

### 3. Backend Developer
**Status:** All CRUD endpoints present. State machine pattern is clean and consistent after QA fixes.

**Gaps found:**
- `/api/leaderboard` endpoint is completely missing — web page calls it and fails in production
- Notifications table has no cleanup mechanism — grows unbounded over time
- `GET /api/conversations/[id]` detail endpoint is missing — conversations can only be listed, not fetched individually

### 4. Frontend Developer (Web)
**Status:** 48 pages implemented. TanStack Query used consistently. Error/loading states generally present.

**Gaps found:**
- Leaderboard page renders but API call fails — visible broken state for any user who navigates there
- Ratings data exists in DB but is never shown on user profiles or listing detail pages
- Error states on some server-rendered detail pages show a blank screen on 404/500 instead of a friendly message
- Admin panel "promote/demote admin" buttons need verification — API exists but UI wiring unconfirmed

### 5. Mobile Developer
**Status:** Mobile screens match web parity for all 5 modules. TanStack Query used consistently.

**Gaps found:**
- No leaderboard screen on mobile (web has one)
- Radar map uses static/demo data — not wired to live `/api/map`
- Some list screens (food, drives) may be missing explicit error states — network failure = silent blank screen
- Rating modal exists but wiring to all completion flows (post-tool-return, post-food-pickup) needs verification

### 6. QA Engineer
**Status:** Happy paths work across all modules. State machine transitions are correct after fix.

**Gaps found:**
- 0 automated unit tests — entire test coverage is smoke tests only
- Leaderboard is a broken feature in production (page + missing API)
- Search exists only for Skills — Events, Food, Tools have no search/filter
- GDPR flows (data export, account deletion) are completely missing

### 7. DevOps / CI Engineer
**Status:** CI pipeline runs build, typecheck, and smoke tests on every push.

**Gaps found:**
- No lint step in CI — ESLint violations pass undetected
- Mobile typecheck runs but no actual Expo build — bundling errors not caught
- No unit test execution in CI — only smoke tests
- CI secrets (`SMOKE_AUTH_EMAIL`, `SMOKE_AUTH_PASSWORD`) not documented in README

### 8. Security Engineer
**Status:** Auth, ownership checks, rate limiting, and input validation are solid across all endpoints. bcrypt with cost factor 12 in use.

**Gaps found:**
- `POST /api/auth/forgot-password` is vulnerable to user enumeration via timing difference (H2 — unfixed)
- Refresh token reuse race condition exists but is mitigated (H1 — documented)
- `isPublic` flag on profiles enforced in most places but lacks automated test coverage
- No automated security regression tests — fixes could be silently reverted

### 9. UX Designer
**Status:** Tailwind CSS applied consistently. Mobile-first responsive grid in use. `next/image` used for optimized image rendering.

**Gaps found:**
- All interactive elements share `green-700` — no visual hierarchy between nav, secondary actions, and primary CTAs
- No confirm dialogs on destructive actions (delete skill, cancel reservation) — a single tap can destroy data
- Error messages are technical (e.g. "Error loading leaderboard") — not friendly or actionable
- No "Add to calendar" affordance on event detail or confirmed reservations — standard UX expectation

---

## Improvement Backlog (Post-MVP)

> Items identified during code review, QA audit, and architecture analysis. Not feature additions — quality, architecture, and UX gaps in the existing product.

**Priority scale:** **P1** critical/now · **P2** high value · **P3** planned · **P4** UX/design polish · **P5** future/deferred

---

### P1 – Critical

| Item | Role | Area | Description |
|------|------|------|-------------|
| Automated test suite | QA / Architect | Architecture | Zero unit tests — only CI smoke tests. Add Vitest unit tests for `lib/state-machine.ts`, Zod schemas, and query functions. The state machine bug found in QA would have been caught by a test. |
| Production Polish Wave 1 | UX Designer | UX | Toasts on food creation and reservation actions (reserve / approve / reject / picked_up / cancel). Confirm dialogs for all destructive mutations. Both web and mobile. |
| Leaderboard API endpoint | Backend Dev | Feature | Web page `/leaderboard` exists and renders, but calls `/api/leaderboard` which does not exist. Page is broken in production. Fix: implement GET `/api/leaderboard` returning top users by points from `userStats`. 15-min fix. |
| Forgot-password timing enumeration | Security | Security | `POST /api/auth/forgot-password` responds faster when the email does not exist, enabling user enumeration. Fix: add 150–250ms synthetic delay for non-matching emails. Documented as H2 in security audit. |
| Lint enforcement in CI | DevOps | CI/CD | ESLint is configured locally but not run in GitHub Actions. Lint regressions (unused vars, type errors, import issues) are not caught before merge. Add `npm run lint` step before the build job. |

---

### P2 – High Value

| Item | Area | Description |
|------|------|-------------|
| Internal HTTP self-fetch refactor | Architecture | 5+ API routes call `fetch('/api/feed')` or similar internally instead of invoking the function directly. Replace with shared helper function → lower latency, simpler error handling, no circular dependency risk. |
| Shared `packages/shared` types | Architecture | Types for `MapMarker`, `FoodShare`, `ToolReservation` etc. are duplicated between `packages/nextjs` and `packages/mobile`. One shared package eliminates runtime drift between platforms. |
| Reports / content flagging | Feature | `reports` table — users flag inappropriate listings (skills, food shares, events, profiles). Admin moderation queue in `/admin`. Essential for community trust at scale. |
| GDPR compliance | Legal | Data export endpoint, account deletion (soft + hard purge after 30 days), cookie consent banner, privacy policy page. Required before any public launch in Bulgaria/EU. |
| Event creator = auto attendee | Feature | When a user creates an event, they should be automatically added as the first attendee. Currently the creator is not registered as a participant. One-line fix in the event create API handler. |
| Search for Events and Food | UX | Skills list has search + filters; Events and Food lists do not. Users cannot find content at scale without search. Add `q` (text search), `status`, and `city` filters matching the skills pattern. |
| Food safety acknowledgment | BA / UX Designer | Trust | Checkbox + brief food safety guidelines shown before a user publishes a food share. Reduces liability and builds trust — standard in OLIO-type apps. No DB change needed, frontend only. |
| Time-credit balance ("time wallet") | BA | Engagement | Show on user profile: hours given / hours received, derived from completed skill requests. Builds on existing `userStats` table. Makes the time-banking value proposition visible and motivating. |
| Ratings display UI | Frontend Dev | Feature | `ratings` table and `/api/ratings` endpoint exist and are seeded. However there is no UI to view ratings on user profiles or listing pages. API is complete — only frontend work needed. |
| Event RSVP capacity race condition | Security / Backend | Concurrency | Capacity check (`attending >= maxCapacity`) and INSERT are not atomic. Two concurrent RSVPs can both pass the check before either inserts, overbooking the event. Fix: enforce via SQL subquery in the INSERT or use a DB-level CHECK trigger. File: `api/events/[id]/rsvp/route.ts:36–66`. |
| Food reservation quantity race condition | Security / Backend | Concurrency | Same pattern as RSVP — `activeCount >= quantity` check and INSERT are not atomic. Concurrent requests can exceed food share quantity. Fix: same atomic INSERT pattern. File: `api/food-shares/[id]/reservations/route.ts:78–93`. |
| `first_tool` badge never awarded | Backend / Badges | Bug | `POST /api/tools` creates the tool and writes feed + audit, but never calls `checkAndAwardBadges`. The badge is defined and checked but was unreachable. Fixed in this session: added `void checkAndAwardBadges(user.sub).catch(() => undefined)` matching the pattern in `skills/route.ts` and `food-shares/route.ts`. |
| `userConsents` GDPR write path missing | GDPR / Backend | Architecture | `userConsents` table defined in `schema.ts` with `userId, consentType, granted, grantedAt, version` columns. Cookie consent banner stores choice in `localStorage` only — no server-side consent record is ever written. EU compliance gap: no audit trail of when a user accepted or declined analytics tracking. Fix: add `POST /api/consent` endpoint that the banner calls on choice, writing a row to `user_consents`. |

---

### P3 – Planned

| Item | Area | Description |
|------|------|-------------|
| i18n full implementation | Feature | Replace `packages/mobile/lib/i18n.ts` stub with `i18next` + `expo-localization`. Seed with EN/BG. Stub currently satisfies TypeScript — install the real packages on a dedicated branch. |
| Cookie consent banner not i18n'd | UX / i18n | Cookie consent text in `cookie-consent-banner.tsx` is hardcoded English. Every other user-facing string uses `t()` via next-intl. Inconsistent — Bulgarian users see English-only consent text. Add translation keys `cookieConsent.text`, `cookieConsent.accept`, `cookieConsent.decline` to `en.json`/`bg.json`. |
| Badge queries include deleted listings | Backend / Badges | `checkAndAwardBadges` counts skills/tools/food without filtering `isNull(deletedAt)`. A user who published and then deleted their only skill still earns `first_skill`. Low severity — badge is still "earned" in spirit — but inconsistent with soft-delete semantics everywhere else. |
| Push notification tokens | DB + Feature | Add `push_tokens` table (`user_id`, `token`, `platform`, `created_at`). Required to send Expo push notifications for reservation updates, messages, and events. |
| User preferences table | DB | Add `user_preferences` (`user_id`, `notification_settings jsonb`, `language`, `timezone`). Enables per-user notification control and language switch. |
| Image upload UX | UX | Add preview-before-upload, re-upload, and remove-image to all image fields (skills, food shares, tools, events). Currently users upload blind with no visual confirmation. |
| Map mobile support | Feature | Mobile map tab uses static/demo markers. Wire to live `/api/map` data via `react-native-maps` (Leaflet equivalent for Expo). Note in ROADMAP risks: non-trivial integration. |
| Make / Remove Admin in Admin Panel | Feature | Verify `/admin/users` has promote/demote to admin role. If missing, add action buttons alongside existing user management. |
| Multiple images / attachments | Feature | Currently every listing has a single `imageUrl`. Add `attachments` table (`id`, `entity_type`, `entity_id`, `url`, `order`) to support multiple images for events and food shares. First image becomes cover card. Requires storage + UI changes. |
| "Story" motivation field on requests | Trust | Add a short optional text field on tool reservations and skill requests: "why do you need this?". Shown to the owner before accepting. Proven in Peerby-type apps to significantly increase acceptance rate. Uses existing `notes` field as foundation. |
| Personal activity stats on profile | Engagement | Show per-user: "N swaps completed, N hours helped, N food shares". Derived from existing data — no new DB tables. Visible on public profile. Drives retention and social proof. |
| Hourly time slots for tool reservations | BA / UX | UX | Extend tool reservation from date-only to date + time slot (e.g. 10:00–12:00). Useful for physical item hand-off coordination. Requires schema addition (`start_time`, `end_time` columns) and UI update. |
| Mobile leaderboard screen | Mobile Dev | Parity | Web has `/leaderboard` page (once API is fixed). Mobile has no equivalent screen. Add leaderboard tab or profile section showing top neighbors. 30-min addition after API is implemented. |
| Mobile build verification in CI | DevOps | CI/CD | CI currently runs `typecheck:mobile` (TS only) but not a full Expo build. Runtime bundling errors (missing native modules, bad imports) are not caught. Add EAS build dry-run or `expo export` step. |
| DB indexes on date-filtered columns | Architect / Backend | Performance | Three columns used in queries lack indexes: `food_shares.available_until`, `events.starts_at`, `community_drives.deadline`. Add via new Drizzle migration — no data change needed, pure performance fix. |
| `updatedAt` on junction tables | Architect | DB | `event_attendees` and `drive_pledges` have no `updatedAt` column. Cannot track when a user changed their RSVP or pledge status. Add via migration to support future audit/analytics. |
| Notification table cleanup | Backend Dev | DB | Notifications accumulate indefinitely with no cleanup mechanism. Add `deletedAt` column (soft delete) and a periodic cleanup job to archive notifications older than 90 days. |

---

### P4 – Design / UX Polish

| Item | Area | Description |
|------|------|-------------|
| Accent color system | Design | Add `amber-500` / `orange-500` as CTA accent alongside primary `green-700`. Currently all interactive elements share the same green — visual hierarchy is flat and CTAs don't stand out from nav links. |
| UI transitions & microinteractions | Design | Route transitions, button press feedback, hover effects, skeleton loaders for home dashboard, skill list, and food list. Currently transitions are abrupt. |
| Generate strong password | Feature | Frontend-only password generator on `/register` and `/reset-password` — show suggestion + copy button. No backend change required. |
| Accessibility pass | Accessibility | Add `aria-label`, `aria-expanded`, focus management to dropdowns, modals, and request forms. Keyboard and screen-reader navigation is currently inconsistent. |
| Calendar export (Google/Apple/Outlook) | UX | "Add to calendar" button on event detail and confirmed tool/skill reservations. Generates `.ics` file or Google Calendar deep-link. No backend change — pure frontend utility. Standard expectation in 2025 community apps. |

---

### P5 – Future / Deferred

| Item | Area | Description |
|------|------|-------------|
| Gamification / achievements | Feature | Points, badges, leaderboard tiers — `points` and `achievements` tables already partially exist. Full implementation deferred post-capstone. |
| Landing page improvements | Marketing | Features section, "How it works" flow, footer with links. Deferred until after all modules were complete. |
| Enterprise / business accounts | Business | Analytics dashboard, API access, sponsored listings, white-label per neighborhood. Long-term revenue track. |
| TanStack Query — Wave F | Architecture | Full query migration for food, tools, and events modules on web (Waves A–E complete). Low urgency now that all modules are stable. |

---

## Product Vision (long-term)

### User Segments
| Segment | Description |
|---------|-------------|
| Individuals | Regular neighbors and citizens |
| Organizers | Event and campaign organizers |
| Charity | Non-profit organizations and volunteers |
| Businesses | Local businesses and partners |

### Business Model
- **Freemium** – Free (core features) + Premium (AI features, advanced analytics, API)
- **Ad-based** – Local businesses, sponsored content
- **Subscription** – Monthly/yearly for organizers and businesses
- **Partnerships** – NGOs, municipalities, media

### Q1–Q4 Timeline (post-capstone)
| Period | Focus |
|--------|-------|
| Q1 | MVP launch (Module 1) |
| Q2 | AI features + Tool Library + Events |
| Q3 | Enterprise features (analytics, branding, API) |
| Q4 | Expansion – new cities and regions |

### Vision
> Neighborhood Hub becomes the standard platform for neighborhood sharing in Bulgaria and Europe.

**Mission:** Help neighbors share skills, time, tools, and food.
**Values:** Community, Sharing, Collaboration, Trust.

---

## Notes and Risks

- **Map on mobile is non-trivial** – `react-native-maps` requires separate integration, allocate extra time
- **Location is neighborhood-level only**, not exact address – GDPR considerations
- **Empty state** for new users – `npm run db:seed` populates demo locations, categories, users, skills, and requests
- **AI integration** is a course priority (Week 3), not "after all modules"
- ~~Module 5 (Tool Library duplicate)~~ → removed, see v0.2
- ~~Module 6 (Charity as separate module)~~ → merged into v0.3 Events as `event_type: 'charity'`
