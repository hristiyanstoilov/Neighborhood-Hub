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

## Extended Role Audit (2026-05-03) — AI Ethics, Security Depth & Behavioral Design

> Three final professional perspectives closing the gap between technical correctness and real-world robustness.

---

### 19. EU AI Act / AI Ethics Officer

**Verdict: AI chat feature has three overlooked regulatory obligations that apply right now.**

The EU AI Act entered into force August 2024. Obligations for general-purpose AI systems and transparency rules apply from August 2025.

**Findings:**
- **GDPR data transfer to Anthropic (US)** — Every message sent to `/api/ai/chat` is forwarded to Anthropic's API, which processes it on US servers. This is a cross-border data transfer under GDPR Chapter V. Anthropic must be listed in the Privacy Policy as a third-party recipient and a Data Processing Agreement (DPA) must be in place. Anthropic offers a DPA — it must be signed before production use.
- **No AI disclosure on chat screen** — EU AI Act Art. 50 requires that users are clearly informed they are interacting with an AI system. A small "Powered by AI" label or banner on the `/chat` page satisfies this — but it must be present and unambiguous.
- **AI-generated food/health advice risk** — If the AI chat recommends specific food shares, gives nutritional advice, or comments on tool safety, it could be classified as a "high-risk" AI system under EU AI Act Annex III. The system prompt should explicitly limit the AI to neighborhood discovery assistance and add a disclaimer that AI responses are not professional advice.
- **No content filtering on AI output** — If a user asks the AI to generate inappropriate content, there is no moderation layer. Anthropic's base model has safety filters, but no app-level guardrails (topic restriction, output review) are implemented.

---

### 20. Penetration Tester

**Verdict: Code review is not a substitute for testing a running app. These attack surfaces have not been exercised.**

**Findings:**
- **JWT algorithm confusion** — The app uses `HS256` (symmetric). If the JWT library has a `none` algorithm bypass or if `alg` is not validated server-side, a crafted token without a signature could be accepted. Needs a running test, not a code read.
- **Mass assignment in update endpoints** — PUT /api/skills/[id], /api/tools/[id], /api/profile etc. parse request body with Zod schemas. If a Zod schema inadvertently allows fields like `ownerId`, `role`, or `emailVerifiedAt`, a crafted request could elevate privileges. Needs fuzzing of every update endpoint with extra unexpected fields.
- **SSRF via image URL** — Food shares, events, tools, and skills accept `imageUrl` strings. If any server-side code ever fetches that URL (e.g. for thumbnail generation or validation), it opens Server-Side Request Forgery. Confirm the imageUrl is only stored and rendered by the browser, never fetched server-side.
- **Business logic abuse: reservation state cycling** — An automated script that creates, accepts, and cancels reservations in a loop could spam owners with notifications and exhaust their listing quota. No per-user daily interaction rate limits exist beyond IP-based limits.
- **Cloudflare R2 object enumeration** — Uploaded files get UUID filenames, but if R2 bucket is misconfigured as public, a URL brute-forcer could discover and download private user avatars. Verify the bucket policy requires signed URLs or is not publicly enumerable.

---

### 21. Behavioral Economist / Gamification Designer

**Verdict: The points and badge system exists but may actively discourage participation due to classic gamification anti-patterns.**

**Findings:**
- **Leaderboard discourages new users** — Research across community platforms consistently shows that visible ranked leaderboards suppress participation from users not in the top 20%. A user who joins and sees they're #47 out of 50 feels behind, not motivated. Better pattern: show personal progress ("You are in the top 40% of your neighborhood this week") instead of absolute rank.
- **Points are invisible during key moments** — Users earn points when skill requests complete, but there is no in-the-moment feedback ("You earned +10 points!"). The reinforcement loop is broken: the rewarding action (completing an exchange) and the reward (seeing points go up) are disconnected.
- **Badge criteria are not communicated** — Users cannot see which badges they can earn, what the criteria are, or how far they are from earning the next one. Hidden achievement systems are motivating only if there are surprise discoveries — but 7 badges is too few for surprise mechanics. Better: show locked badge outlines with criteria.
- **Flat gamification** — All completed skill requests award the same points regardless of complexity. A 5-hour guitar lesson and a 30-minute tech help call award the same. This undervalues long-term commitment and favors quantity over quality.
- **No streak or recency mechanics** — Users who were active last month but are now dormant receive no nudge to return. A "you haven't shared anything in 3 weeks" notification or streak counter drives re-engagement in community apps.
- **community_hero badge requires 10 completed requests** — This is a very high bar for a new platform with few users. The first badge milestone should be reachable within the first 1-2 interactions to create early habit formation.

---

## Extended Role Audit (2026-05-03) — Platform Reliability, Growth & Finance

> Three additional roles identified as genuinely important gaps post first extended audit.

---

### 16. SRE / Platform Reliability Engineer

**Verdict: App is running blind. Any outage is discovered by users, not the team.**

**Findings:**
- **No uptime monitoring** — No UptimeRobot, Betterstack, or equivalent configured. If the Netlify deployment or Neon DB goes down, the team finds out when users complain, not from an alert.
- **No error tracking** — PostHog is analytics, not error tracking. Unhandled exceptions, failed API calls, and 500 errors are logged to Netlify's function console only — not aggregated, not alerted. Sentry or Betterstack Logs would cover this.
- **No backup strategy documented for Neon** — Neon has point-in-time restore on paid plans but the project is on free tier. What is the recovery plan if the DB is corrupted or accidentally wiped?
- **Netlify function timeout risk** — Free tier serverless functions have a 10-second execution limit. The AI chat endpoint streams tokens from Anthropic — on slow responses or large contexts this can time out silently.
- **No cost monitoring** — All infrastructure is on free tiers (Neon, Netlify, Upstash, Cloudflare R2, Resend, PostHog, Anthropic). Each has hard limits. At real scale: Neon storage limit, Resend 3000 emails/month, Upstash request cap, Anthropic per-token cost. No alert exists for approaching any of these limits.
- **Cold start latency** — Netlify serverless functions cold-start on every new request after inactivity. No warm-up strategy or caching layer in place.

---

### 17. Business Development / Partnership Manager

**Verdict: The app's growth model is undefined. Neighborhood apps live or die by local partnerships — not SEO or paid ads.**

**Findings:**
- **No municipality partnership strategy** — Sofia, Plovdiv, and Varna municipalities run digital citizen engagement programs and community grants. A neighborhood sharing platform is a direct fit. No outreach plan exists.
- **No NGO partner pipeline** — Bulgarian Red Cross, Каузи.БГ, and Хора за хора regularly run food and resource sharing drives. Integrating them as "verified organizers" gives the platform immediate content and trust.
- **No local business integration** — Local repair shops, tool rental companies, and cooking schools are natural sponsors for tools/skills modules. A "verified business" badge costs nothing technically and creates a revenue opportunity.
- **No launch event strategy** — Neighborhood apps in Europe (Peerby NL, OLIO UK) launched via physical events in target neighborhoods — one street, one block at a time. No equivalent strategy planned.
- **No referral or invite system** — Community apps grow fastest through neighborhood-level word of mouth. No referral link, no "invite your neighbor" flow exists.
- **No press / media strategy** — Bulgarian tech media (Kaldata, Dev.bg, CIO.bg) cover local startups. No press kit, no launch story, no contact list.

---

### 18. Financial Controller / Accountant

**Verdict: Free tier infrastructure will break under real load. Monetization path is undefined and legally complex in Bulgaria.**

**Findings:**
- **Infrastructure cost at scale** — Current free tier limits and estimated costs at 1,000 active users per month:
  - Neon: 0.5 GB storage free → likely fine; compute hours may exceed free tier
  - Netlify: 125k function invocations/month free → a busy day can exhaust this
  - Upstash Redis: 10,000 commands/day free → rate limiting alone will hit this
  - Resend: 3,000 emails/month free → password resets + notifications will exceed this quickly
  - Anthropic (Claude): ~$0.003/1K tokens → 1,000 AI chat sessions/month ≈ $15–50/month
  - Cloudflare R2: 10 GB free → image uploads grow fast
- **No cost projection model** — No spreadsheet or estimate for monthly infrastructure cost at 100 / 1,000 / 10,000 users.
- **VAT (НДС) for digital services** — If any premium tier is added, Bulgarian digital service providers must charge 20% VAT on sales to Bulgarian consumers and register for EU VAT OSS for sales to other EU residents. Stripe handles collection but registration with НАП is required.
- **Invoice generation** — Bulgarian accounting law requires an invoice (фактура) for every B2C digital sale within 5 days. Stripe Tax can automate this, but the legal entity must exist first.
- **No legal entity** — The app currently has no registered company (ООД/ЕТ). Without one: no bank account for revenue, no contracts with partners, no VAT registration, no ability to hire.

---

## Senior UI/UX Designer Audit (2026-05-03) — Full App Walkthrough

> Deep review based on reading actual component code: `nav.tsx`, `footer.tsx`, `page.tsx` (homepage), `skills-client.tsx`, layout files, and component patterns. Split into Navigation, Visual Design System, Page-level findings, and Redesign recommendations.

---

### Navigation — Critical Issues

**The nav has 11+ top-level links in a single horizontal flex row with no mobile menu.**

Reading `nav.tsx` line 93–163: all links render in a `<nav className="flex items-center gap-4 text-sm">` with no breakpoint hiding. On a 375px phone, this overflows — there is no hamburger menu, no drawer, no bottom tab bar. Mobile users can only tap the "Search" link (which opens a search box). They cannot reach Tools, Events, Drives, Food, Feed, Map, Leaderboard, Messages, or Radar from a phone unless they type the URL directly.

**Active state is invisible.** `aria-current="page"` is set correctly, but there is no corresponding visual CSS class that makes the active link look different from inactive ones. A user cannot tell which section they're in.

**Information architecture is flat and overloaded.** 11 peer-level items (Skills, Tools, Events, Drives, Food, Feed, Map, Leaderboard, Messages, Radar, AI Chat) treats every section as equally important. The five core content modules (Skills, Tools, Events, Drives, Food) are mixed with utility screens (Map, Radar) and social features (Feed, Leaderboard, Messages, AI Chat) with no grouping.

**Findings:**

| # | Severity | Finding |
|---|----------|---------|
| N1 | **CRITICAL** | No mobile navigation. Users on phones cannot reach most sections of the app. No hamburger menu, no mobile drawer, no bottom tab bar. |
| N2 | **HIGH** | No active link indicator. `aria-current` is set but has no visual companion. Users cannot tell which section they're in. |
| N3 | **HIGH** | 11 top-level nav items at the same visual weight. No information hierarchy. On a 1280px screen this already crowds. |
| N4 | **MEDIUM** | Footer only has 6 module links — no Privacy Policy, Terms, Contact, About, Help. Legal links have nowhere to live. |
| N5 | **LOW** | Logout button uses `text-gray-500 hover:text-red-500` — hover reveal of red is jarring and not a standard pattern for logout (which is not destructive). |

---

### Visual Design System — Findings

Reading `page.tsx`, `skills-client.tsx`, `layout.tsx`, and nav:

**Single color for everything.** `green-700` is used for: primary CTAs ("Offer Skill", "Register"), nav hover states, active badges, link "View all", stats bubble, search ring, icon backgrounds. When everything is green, nothing stands out. A user's eye cannot prioritize — the CTA button looks the same as a nav link hover.

**No brand typography.** The app uses the browser default system font (no `font-family` declared in `globals.css` or layout). All text renders in system-ui/Segoe UI/etc. depending on the device. No distinctive brand feel.

**Narrow max-width.** `max-w-5xl` (1024px) means on a 1440px or 4K screen there are ~200px of empty gray on each side. Modern community apps use `max-w-7xl` (1280px) or fluid with a sidebar. The current width feels cramped on desktop despite looking fine on 1280px laptops.

**Status badges show raw English strings.** In `page.tsx` lines 118–122 and 275–278: the homepage skill card shows `skill.status` directly (`"available"`, `"busy"`, `"unavailable"`) without running through the i18n formatter. Bulgarian users see English status labels on the homepage.

**Hero section is bare.** The logged-out hero is three lines of text, two buttons, and a stats count. No illustration, no screenshot, no social proof quote, no background pattern. The visual impact is minimal — it looks like an MVP placeholder, not a product.

**Browse tiles are good** — the icon grid on the logged-in dashboard (AppIcon + emerald background + label) is the strongest UI pattern in the app. Clean, consistent, recognizable.

**Card border hover** (`hover:border-green-400 hover:shadow-sm`) is subtle and nice. Cards feel lightweight and modern.

**Findings:**

| # | Severity | Finding |
|---|----------|---------|
| D1 | **HIGH** | Single-color system: `green-700` is used for CTAs, nav hovers, links, active states, icon backgrounds — all at the same weight. No visual hierarchy between actions and navigation. |
| D2 | **HIGH** | Homepage status badges show raw English strings (`"available"`) not i18n-formatted values. Breaks Bulgarian experience on the most-visited page. |
| D3 | **MEDIUM** | No brand typography. System font renders differently on every device — no consistent brand feel. |
| D4 | **MEDIUM** | `max-w-5xl` (1024px) content area leaves large empty margins on desktop monitors wider than 1280px. |
| D5 | **MEDIUM** | Hero section (logged-out landing) has no visual anchor — no illustration, screenshot, or social proof. Reads as an unfinished placeholder. |
| D6 | **LOW** | Footer is minimal — copyright + 6 module links. No company columns, no legal links, no contact. Has nowhere to put Privacy Policy and Terms links once they exist. |

---

### Page-level Findings

**Logged-in Dashboard:**
- "Browse" and "My Activity" icon grids are visually identical — same tile style, same icon treatment, same font size. A new user cannot distinguish "browse public content" from "manage my own stuff".
- The radar widget (neighborhood pills) is a great concept but the pills have no hover tooltip explaining what "Лозенец · 8" means — new users don't know the number is the skill count.
- `recentSkills` shows up to 6 cards but if the user has already seen all 6, the section feels stale. No "last updated" or personalization signal.

**Skills List:**
- The "Offer Skill" CTA is placed top-right opposite the page title — correct pattern.
- Filters are present — good.
- Empty state and error state are handled with shared components — correct.
- Pagination exists — correct.

**Footer:**
- © 2026 Neighborhood Hub + tagline + 6 links — all in one horizontal line. Visually cramped on mobile.
- Missing: Privacy Policy, Terms, Contact, About, Community Guidelines, Help.

---

### Redesign Recommendations (prioritized)

**Immediate (code changes, high UX impact):**

1. **Mobile navigation** — Add a hamburger button visible below `lg:`. On click, show a full-screen or slide-in drawer with all nav links. This is the #1 usability gap.
2. **Active nav indicator** — Add `text-green-700 font-medium` to the active link class when `isActive()` returns true. One-line change.
3. **Status badges i18n on homepage** — Replace `skill.status` on the homepage card with `t('status.' + skill.status)` using the existing `common.status.*` i18n keys.
4. **Footer legal links** — Add Privacy Policy and Terms links to the footer now (even as `#` placeholders). When the pages exist, they'll be live.
5. **CTA color differentiation** — Change the primary CTA buttons (`bg-green-700`) to `bg-emerald-600` and introduce `amber-600` for secondary-action buttons. This separates navigation affordances (green) from action affordances (amber) without a full rebrand.

**Medium-term (design system changes):**

6. **Brand font** — Add `Inter` or `Plus Jakarta Sans` via `next/font/google`. One import, applied to `<html>`. Immediately elevates the product feel.
7. **Nav restructuring** — Keep 5 module links visible (Skills, Tools, Events, Drives, Food). Move Feed, Map, Radar, Leaderboard into a "Discover" dropdown. Move Messages, AI Chat, Notifications, Profile into a right-side user cluster with icons instead of text links.
8. **Dashboard section differentiation** — Add a subtle background color difference (`bg-white` vs `bg-gray-50`) between "Browse" and "My Activity" grids, or separate with a labeled divider.
9. **Hero improvement** — Add a 3-column "social proof" mini-section below the two CTAs: icons with stats (N skills · N users · N neighborhoods). Costs nothing technically, adds immediate trust signal.
10. **Max-width to 7xl** — Change `max-w-5xl` to `max-w-7xl` in `layout.tsx`. Single character change, gives breathing room on large screens.

---

> Six additional professional perspectives not covered in the 9-role technical audit. These roles are critical for any real product launch, not just a capstone demo. Findings fed into the Improvement Backlog.

---

### 10. Corporate / GDPR Lawyer

**Verdict: App cannot legally launch in Bulgaria/EU in its current state.**

Every app that collects personal data from EU residents must comply with GDPR — this is not optional and failure carries fines of up to 4% of annual turnover or €20M.

**Findings:**
- **No Privacy Policy page** — GDPR Article 13 requires that at the point of data collection (registration), users are informed of: what data is collected, the legal basis for processing, retention periods, third-party recipients, and all 8 data subject rights. No such page exists.
- **No Terms of Service** — Without T&C, there is no legal agreement between the platform and users. No enforceable rules of conduct, no IP license for user-uploaded content, no liability limitation, no dispute resolution clause.
- **Cookie banner has no Privacy Policy link** — GDPR requires linking to the full privacy policy from any consent mechanism. Current banner has text and buttons, but no link.
- **User-generated content — no IP license** — Users upload photos (skills, tools, food, events, avatars). Without a license grant clause in the T&C, the platform has no legal right to store, display, or reproduce that content.
- **Food sharing — no liability disclaimer** — If a user gets food poisoning from a shared meal, the platform faces exposure without an explicit "we are not responsible for food quality" disclaimer and acknowledgment by the sharing user at listing creation time.
- **Tool sharing — no damage liability clause** — If a borrowed tool damages property or causes injury, the platform's exposure is undefined. A disclaimer + tool owner acknowledgment is needed.
- **No minimum age declaration** — GDPR requires parental consent for users under 16 (in Bulgaria). No age gate or declaration exists at registration.
- **Data retention period not defined** — Soft deletes exist, but no automated hard-purge schedule is documented or implemented. GDPR requires specifying exact retention periods.

---

### 11. Data Protection Officer (DPO)

**Verdict: GDPR Article rights are partially implemented but not complete.**

**Findings:**
- **Right of Access (Art. 15)** — No `/profile/data-export` endpoint. Users cannot receive a machine-readable copy of all data the platform holds about them. A data export feature is in the P2 backlog ("GDPR compliance") but not implemented.
- **Right to Erasure (Art. 17)** — Soft delete (`deletedAt`) exists but hard purge after 30 days is not implemented. Deleted user's data (messages, ratings, audit log entries) is retained indefinitely. Need a scheduled purge job.
- **Right to Portability (Art. 20)** — No JSON/CSV export of user data. Related to Art. 15 — same endpoint covers both.
- **Consent records** — Now fixed (`userConsents` table + `POST /api/consent`) — ✅ resolved in current session.
- **Breach notification procedure** — No documented plan for notifying the supervisory authority (KZLD in Bulgaria) within 72 hours of a data breach, as required by GDPR Art. 33.
- **Privacy notice at registration** — The registration form collects name, email, password, and optionally location. There is no inline notice or link to Privacy Policy at the point of collection.

---

### 12. Community Manager / Trust & Safety

**Verdict: App has zero safety infrastructure. Fine for a demo; dangerous at real scale.**

**Findings:**
- **No community guidelines** — Users have no published reference for what content and behavior is acceptable. Without this, moderation decisions are arbitrary and indefensible.
- **No content moderation queue** — Reports table is in P2 backlog but not implemented. Admin panel has no moderation interface. A single bad actor can post inappropriate listings with no removal mechanism.
- **No user blocking** — A user being harassed via direct messages has no way to block the sender. Critical safety gap for a platform involving physical meetups (tool handoffs, food pickups, skill sessions).
- **No rate limiting on content creation** — Upstash rate limits exist on login/register/AI but not on listing creation. One user could spam hundreds of fake food shares or skill listings in a few minutes.
- **No neighborhood verification** — Any user can claim to be in any neighborhood and see/contact all local listings. A bad actor in Sofia can see and interact with listings in Plovdiv with no friction.
- **No profile verification** — No identity signal (verified email ✅, but no phone number, no address, no social proof). Low-trust environment for physical item exchange.
- **Fake listing prevention** — No duplicate detection. Same food share can be listed 50 times by the same user.

---

### 13. App Store Compliance Officer (Mobile)

**Verdict: Mobile app will be rejected by both Apple and Google in its current state.**

**Findings:**
- **No Privacy Policy URL** — Both Apple App Store and Google Play Store require a publicly accessible Privacy Policy URL before any app is approved. This is a hard blocker for submission. Since the Privacy Policy page doesn't exist (see Role 10), this is a two-level dependency.
- **Google Play Data Safety form** — Google requires declaring every data type collected (email, name, location, photos, messages), the purpose, and whether it's shared with third parties. This form cannot be completed honestly without a documented Privacy Policy.
- **Apple App Privacy nutrition label** — Apple requires the same data declaration in the App Store listing. Inaccurate declarations result in rejection or removal.
- **Content rating** — App must be self-rated for age-appropriateness. The app has direct messaging between strangers and meetup coordination — needs at least a "12+" rating with appropriate metadata.
- **App store metadata** — No screenshots, short/long descriptions, keywords, or promotional text prepared for either store. Required before submission.

---

### 14. Customer Support / Operations

**Verdict: Users have no help path. Any real issue creates a dead end.**

**Findings:**
- **No help center or FAQ** — New users don't know how to make a skill request, what "pending/accepted" means, or how to recover a forgotten password (even though the flow exists). No documentation.
- **No contact form or support email** — If a food share dispute occurs (e.g., item not as described), users have no way to reach the platform team. Footer has no contact link.
- **No onboarding flow** — Users register and land on a dashboard with no guidance. No "first steps" prompt, no empty-state tutorial, no welcome email with suggested actions.
- **No in-app error reporting** — Users who hit a broken state (404, 500) see a generic message with no path forward and no way to report the issue.

---

### 15. SEO / Growth Specialist

**Verdict: App is invisible to search engines. All organic discovery is blocked.**

**Findings:**
- **No unique meta titles/descriptions on listing pages** — `/skills/[id]`, `/tools/[id]`, `/events/[id]`, `/food/[id]` all use the default `"Neighborhood Hub"` title. Google cannot distinguish between pages. No social sharing preview works correctly.
- **No Open Graph tags** — Sharing a listing link on Facebook, Viber, or Telegram shows no preview image, no title, no description. Zero viral sharing value.
- **No sitemap.xml** — Search engines cannot discover listing pages. Only the homepage is likely indexed.
- **Admin and API routes not excluded** — No `robots.txt` protecting `/admin/**` and `/api/**` from indexing.
- **No structured data (JSON-LD)** — Events, skills, and food listings could appear in Google's rich results (Event cards, how-to panels) with structured data. Currently no schema markup exists.

---

## Improvement Backlog (Post-MVP)

> Full re-prioritization after 21-role audit (2026-05-03). Covers technical, legal, trust & safety, platform reliability, growth, and UX gaps.
> ✅ = already fixed in current sessions.

**Priority scale:** **P1** critical blocker · **P2** high value, next sprint · **P3** planned · **P4** polish · **P5** future/deferred

---

### P1 – Critical (launch blockers or active user harm)

| Item | Role | Description |
|------|------|-------------|
| **Privacy Policy URL for App Store** | App Store Compliance | Apple App Store and Google Play both reject apps without a live Privacy Policy URL. Blocks mobile app submission entirely — depends on page above. |
| **Uptime monitoring** | SRE | No external monitor. App downtime is discovered by users, not the team. Add UptimeRobot or Betterstack free tier → `/api/health`. 10-minute setup. |
| ~~**Sentry error tracking**~~ | ✅ Done | `@sentry/nextjs` installed; `sentry.{client,server,edge}.config.ts` — disabled unless `SENTRY_DSN` set; CSP updated. |
| ~~**Automated test suite**~~ | ✅ Done | Vitest: 16 tests across `state-machine.test.ts` + `auth.test.ts`; CI step added. |
| ~~Lint enforcement in CI~~ | ✅ Done | `npm run lint:web` step added to CI before build; 3 pre-existing errors fixed. |
| ~~Mobile navigation~~ | ✅ Done | Hamburger drawer with all module links, Escape-to-close, auto-close on route change. |
| ~~Privacy Policy page~~ | ✅ Done | `/privacy` — GDPR Art. 13 compliant: legal bases, all processors, retention, Art. 15–22 rights. |
| ~~Terms of Service page~~ | ✅ Done | `/terms` — eligibility, acceptable use, module rules, AI disclaimer, governing law. |
| ~~Privacy Policy link in cookie banner~~ | ✅ Done | Inline link to `/privacy` added to consent banner text. |
| ~~Anthropic DPA + AI disclosure~~ | ✅ Done | EU AI Act Art. 50 blue banner on `/chat`; Anthropic listed as processor in Privacy Policy. |
| ~~Registration privacy notice + age gate~~ | ✅ Done | Required 16+ checkbox + "By registering you agree to Privacy Policy and Terms" notice on register form. |
| ~~Active nav link indicator~~ | ✅ Done | `navLinkClass()` helper: active = `font-medium text-green-700`. |
| ~~Status badges i18n on homepage~~ | ✅ Done | Homepage uses `tCommon('status.${skill.status}')` — BG users see translated status. |
| ~~Leaderboard API endpoint~~ | ✅ Fixed | Implemented + soft-delete filter added. |
| ~~Forgot-password timing enumeration~~ | ✅ Fixed | `MIN_RESPONSE_MS = 400` padding in place. |
| ~~`first_tool` badge never awarded~~ | ✅ Fixed | `checkAndAwardBadges` added to `POST /api/tools`. |
| ~~`userConsents` GDPR write path~~ | ✅ Fixed | `POST /api/consent` implemented, banner wired. |
| ~~Cookie consent banner i18n~~ | ✅ Fixed | `useTranslations('cookieConsent')` + BG translation added. |

---

### P2 – High Value (next development sprint)

| Item | Role | Description |
|------|------|-------------|
| **Nav information architecture** | UX Designer | 11 top-level links at equal visual weight. Restructure: keep 5 core modules (Skills, Tools, Events, Drives, Food) visible; move Feed/Map/Radar/Leaderboard into a "Discover" dropdown; move Messages/AI Chat/Notifications/Profile into a right-side icon cluster. |
| ~~**Footer redesign**~~ | ✅ Done | 4-column footer: Explore, Community, Support, Legal. Privacy Policy and Terms now have a permanent home. |
| ~~**Health check endpoint**~~ | ✅ Done | `GET /api/health` → `{ status, db, ts }` — returns 503 if DB unreachable. |
| **Reports / content flagging** | Trust & Safety | `reports` table + admin moderation queue in `/admin`. Without this, a single bad actor can post unlimited inappropriate listings with no removal path. |
| **User blocking** | Trust & Safety | Users coordinate physical meetups (tool handoffs, food pickups). Without block functionality, harassment victims have no safe exit. Requires `blocks` table + enforcement in DM and listing APIs. |
| **Content creation rate limits** | Trust & Safety | No per-user rate limit on `POST /api/skills`, `/api/tools`, `/api/food-shares`. A single account can flood the platform. Add daily limits via Upstash (existing dependency). |
| **GDPR data export + hard purge** | Legal / DPO | Art. 15/20 data export endpoint (machine-readable JSON of user's own data) + scheduled hard purge of soft-deleted accounts after 30 days (Art. 17). |
| **Contact / support form** | Operations | No contact path for disputes, bugs, or account issues. A `/contact` page with a Resend email (already integrated) is a 30-minute implementation. |
| **Onboarding flow** | Operations / UX | Users land on a blank dashboard after registration with no guidance. Add first-login "what to do first" nudge. Directly improves activation rate. |
| **Points reinforcement feedback** | Behavioral Economist | Users earn points when requests complete but receive no in-moment signal. Add "+10 points!" toast at the moment of reward. Closes the broken reinforcement loop. |
| **Leaderboard personal progress view** | Behavioral Economist | Absolute rank discourages users not in top 20%. Show "You are in the top 40% of your neighborhood this week" instead of "#47 of 50". Same data, better psychology. |
| **Badge criteria visible to users** | Behavioral Economist | 7 badges with no visible criteria or progress. Add locked badge outlines + "Earn this by: completing 10 requests" text. Turns hidden achievements into visible goals. |
| **Health check endpoint** | SRE | Add `GET /api/health` returning `{ status, db, ts }`. Required for uptime monitors (above) and deployment pipelines. |
| **Infrastructure cost model** | Finance | Document free tier limits and projected cost at 1k/10k users for: Neon, Netlify, Upstash, Resend, Anthropic, Cloudflare R2. Required before any partner or investor conversation. |
| **AI chat timeout guard** | SRE | Netlify free tier functions time out at 10 seconds. AI chat streaming can exceed this on slow responses. Add `AbortController` (9s timeout) + `max_tokens` cap server-side. |
| Event creator = auto attendee | Backend | One-line fix: automatically insert the event creator as first attendee at creation. Currently the organizer is not registered as a participant. |
| Search for Events and Food | UX | Skills has search + filters. Events and Food lists have none. Unusable at scale without `q`, `status`, `city` filters. |
| Food safety acknowledgment | Legal / Trust | Checkbox at food share creation: "I confirm this food is safe for consumption." Closes both the trust gap and the liability gap in one frontend-only change. |
| Ratings display UI | Frontend | `ratings` table and API exist and are seeded. No UI on user profiles or listing pages. API is complete — frontend only. |
| Event RSVP race condition | Security / Backend | Capacity check and INSERT are not atomic. Two concurrent RSVPs can both pass `attending >= maxCapacity`. Fix: atomic SQL subquery or DB CHECK trigger. `api/events/[id]/rsvp/route.ts:36–66`. |
| Food reservation race condition | Security / Backend | Same pattern — `activeCount >= quantity` check and INSERT not atomic. `api/food-shares/[id]/reservations/route.ts:78–93`. |
| Time-credit balance ("time wallet") | BA | Show hours given/received on profile, derived from completed skill requests. Makes the time-banking value proposition visible and motivating. |

---

### P3 – Planned (important, not urgent)

| Item | Role | Description |
|------|------|-------------|
| **SEO meta tags on listing pages** | SEO | `generateMetadata()` on `/skills/[id]`, `/tools/[id]`, `/events/[id]`, `/food/[id]` — unique `<title>` and `<meta description>` per listing. 30 min per module. |
| **Open Graph tags** | SEO / Growth | Add `og:title`, `og:description`, `og:image` in same `generateMetadata()` pass. Sharing any listing on Viber/Messenger currently shows no preview. |
| **sitemap.xml** | SEO | `app/sitemap.ts` generating URLs for all public listing pages. Next.js App Router makes this ~1 hour of work. |
| **robots.txt** | SEO / Security | `app/robots.ts` disallowing `/admin/**`, `/api/**`, `/profile/**` from indexing. |
| **Hero section improvement** | UX Designer | Logged-out hero is three lines of text + two buttons. Add a 3-column social proof row (N skills · N users · N neighborhoods) below the CTAs. No DB change — stats are already fetched. |
| **Max-width to 7xl** | UX Designer | Change `max-w-5xl` (1024px) to `max-w-7xl` (1280px) in `layout.tsx`. One character change. On large monitors the current layout wastes 200px on each side. |
| **Dashboard section visual separation** | UX Designer | "Browse" and "My Activity" icon grids are visually identical. Add a subtle background or labeled divider so users understand the difference between browsing content and managing their own. |
| **Community guidelines page** | Trust & Safety | Static `/guidelines` page defining acceptable use. Linked from footer and listing creation forms. Required for defensible moderation decisions. |
| **Referral / invite system** | BD | "Invite your neighbor" — unique link per user, `referrals` table, points awarded on successful registration. Highest-ROI growth mechanic for community apps. |
| **Municipality partnership page** | BD | Static `/for-municipalities` landing page. Required before any government outreach — gives legitimacy and a clear ask. |
| **Streak / re-engagement mechanics** | Behavioral Economist | Users who were active and then dormant receive no nudge. Add "You haven't shared in 3 weeks" notification or streak counter to drive return visits. |
| **`community_hero` badge threshold reduction** | Behavioral Economist | Requires 10 completed requests — too high for a new platform. Reduce to 3 for early habit formation. First meaningful milestone should be reachable within 2–3 interactions. |
| i18n mobile full implementation | Mobile / i18n | Replace `packages/mobile/lib/i18n.ts` stub with `i18next` + `expo-localization`. EN/BG seed. |
| Data breach incident response plan | DPO | Document KZLD notification procedure (GDPR Art. 33 — 72 hours). Private ops runbook. |
| DB indexes on date-filtered columns | Architect | `food_shares.available_until`, `events.starts_at`, `community_drives.deadline` — new Drizzle migration, pure performance. |
| `updatedAt` on junction tables | Architect | `event_attendees` and `drive_pledges` missing `updatedAt`. Add via migration for future audit/analytics. |
| Notification table cleanup | Backend | No cleanup mechanism — table grows unbounded. Add soft-delete + 90-day archive job. |
| Push notification tokens | DB | `push_tokens` table for Expo push notifications. |
| User preferences table | DB | `user_preferences` for notification settings, language, timezone. |
| ~~Image upload — R2 backend + UI component~~ | ✅ Done | `POST /api/upload` (Cloudflare R2, magic-byte validation, 5 MB limit); `<ImageUpload>` component with live preview, Replace, Remove buttons. Wired to skills, tools, food-share create/edit forms. |
| Image upload UX — wire to remaining forms | UX | `<ImageUpload>` not yet used in: tools/new, tools/[id]/edit, events/new, drives/new. Pattern exists — add import + field. |
| Personal activity stats on profile | Engagement | "N swaps, N hours helped, N food shares" on public profile. Derived from existing data. |
| Mobile leaderboard screen | Mobile | Web leaderboard exists; mobile has no equivalent. |
| Mobile build verification in CI | DevOps | Add EAS build dry-run or `expo export` step — currently only typecheck runs. |
| Map mobile support | Mobile | Wire live `/api/map` to mobile map tab. Currently static/demo markers. |
| Badge queries soft-delete filter | Backend | `checkAndAwardBadges` counts listings without `isNull(deletedAt)`. Low severity but inconsistent. |
| "Story" motivation field on requests | Trust | Optional "why do you need this?" field on tool/skill requests, visible to owner before accepting. Proven in Peerby-type apps to significantly increase acceptance rates. |
| Make / Remove Admin in Admin Panel | Feature | Verify promote/demote buttons exist in `/admin/users`. Add if missing. |

---

### P4 – Design & UX Polish

| Item | Role | Description |
|------|------|-------------|
| **Brand typography** | UX Designer | No custom font — system font renders differently on every device. Add `Inter` or `Plus Jakarta Sans` via `next/font/google`. One import, immediate brand elevation. |
| **CTA color differentiation** | UX Designer | `green-700` is used for nav hovers AND primary CTA buttons — no visual hierarchy. Change CTA buttons to `emerald-600` or introduce `amber-600` for action affordances vs. navigation affordances. |
| Accessibility pass (WCAG 2.1 AA) | Accessibility | Systematic `aria-label`, `aria-expanded`, focus management audit. EN 301 549 EU standard applies in Bulgaria. |
| App Store submission materials | App Store | Screenshots, descriptions EN + BG, content rating forms, Google Play Data Safety form. |
| Calendar export | UX | `.ics` / Google Calendar deep-link on event detail and confirmed reservations. |
| Help center / FAQ page | Operations | Static `/help` answering most common new-user questions. |
| Generate strong password | UX | Password suggestion + copy button on `/register` and `/reset-password`. Frontend only. |
| AI chat content guardrails | AI Ethics | App-level topic restriction in system prompt ("neighborhood discovery only") + explicit "not professional advice" disclaimer. Reduces EU AI Act high-risk classification risk. |
| UI transitions & microinteractions | Design | Route transitions, button press feedback, skeleton loaders for busiest screens. |
| Hourly time slots for tool reservations | BA / UX | Date + time slot (10:00–12:00) for tool handoff coordination. Schema change required. |
| Multiple images / attachments | Feature | `attachments` table for multiple images per listing. |

---

### P5 – Future / Deferred

| Item | Role | Description |
|------|------|-------------|
| Pen tester engagement | Security | Code review is not a substitute for testing a running app. JWT algorithm confusion, mass assignment fuzzing, SSRF via imageUrl, Cloudflare R2 enumeration — none of these can be verified without an active pentest. |
| Gamification redesign | Behavioral Economist | Variable points by exchange complexity, visible progress bars, streak mechanics, "neighborhood contribution score" rather than global ranking. Full redesign when platform has real users to calibrate on. |
| Internal HTTP self-fetch refactor | Architect | 5+ routes call `fetch('/api/...')` internally. Replace with direct function calls for lower latency and no circular dependency risk. Low urgency as long as the pattern is consistent. |
| Shared `packages/shared` types | Architect | Shared package for `MapMarker`, `FoodShare`, `ToolReservation` types between web and mobile. Eliminates drift. |
| Flat point system redesign | Behavioral Economist | All completed requests award equal points regardless of complexity. Redesign with weighted scoring once there is enough data on exchange types. |
| Referral incentive fine-tuning | BD | Once referral system (P3) ships, A/B test incentive sizes and messaging. |
| Enterprise / business accounts | Business | Analytics, API, sponsored listings, white-label. Long-term revenue track. |
| TanStack Query — Wave F | Architecture | Full query migration for food, tools, events on web. Low urgency now that all modules are stable. |
| Landing page visual rebrand | Marketing | Full hero illustration, testimonials, product screenshots. Post-launch when there are real users to feature. |

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
