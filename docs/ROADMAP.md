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

Apply this process after every feature change before commit:

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

## v0.2 – Module 2: Neighborhood Tool Library *(planned – after MVP)*

- Share tools and household items (drill, ladder, lawnmower, etc.)
- Status: available / in use / on loan
- Reservations with date/time
- **DB:** `tools` + `tool_reservations`

---

## v0.3 – Module 3: Neighborhood Events *(planned – after MVP)*

- Community events + charity initiatives (charity is a subtype of event)
- RSVP / attendance registration
- **DB:** `events` + `event_attendees` (with field `event_type: 'community' | 'charity' | 'meetup'`)
- **Note:** Charity is not a separate module — use `event_type: 'charity'`

---

## v0.4 – Module 4: Neighborhood Food Sharing *(planned – after MVP)*

- Share surplus food (home-cooked, seasonal produce, etc.)
- Status: available / reserved / picked_up
- **DB:** `food_shares` + `food_reservations`

---

## v0.5 – Module 5: Neighborhood Chat / Feed *(planned – later)*

- Social feed of neighborhood activities
- Direct messages or group chats per neighborhood

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
