# Neighborhood Hub – Roadmap

> Last updated: 2026-05-14 (full role-based audit)

---

## MVP Status

All 5 core modules complete and deployed.

| Version | Module | Status |
|---------|--------|--------|
| v0.1 | Auth + Skill Swap + Map | ✅ Done |
| v0.2 | Tool Library | ✅ Done |
| v0.3 | Events | ✅ Done |
| v0.4 | Food Sharing | ✅ Done |
| v0.5 | Feed + Direct Messages | ✅ Done |

---

## Development Process

### Feature Quality Gate (run after every feature change before commit)

1. **Senior Dev Code Review** — review only changed files; focus on bugs, regressions, error handling, maintainability; order findings by severity with file references.
2. **Senior QA Validation** — run `npm run build:web`; smoke impacted routes/endpoints; validate at least one happy path and one negative path.
3. **Commit Decision** — commit only when critical/high findings are resolved; document rationale for any medium/low left open.

### Milestone Review Protocol

**When to trigger:** end of a session with 5+ commits, before any `git push`, after completing a module, before deployment.

**How to run:** type `/milestone-review` in Claude Code.

| Role | Focus |
|------|-------|
| Senior Architect | Architecture health, schema gaps, API consistency, scaling risks |
| Senior Tech Lead | Code quality, DRY violations, dead code, edge case bugs |
| Senior QA | State machine correctness, race conditions, unguarded paths |
| Docs Sync | ROADMAP alignment, AGENTS.md updates, CLAUDE.md Applied Learning |

---

## Improvement Backlog

### P1 – Critical (launch blockers)

| Item | Description |
|------|-------------|
| Privacy Policy URL for App Store | Apple + Google reject apps without a live Privacy Policy URL. Blocker for both store submissions. Add once domain is confirmed and page is publicly hosted. |
| Uptime monitoring | No external monitor — downtime discovered by users, not team. Add UptimeRobot or Betterstack free tier pointing to `GET /api/health`. 10-minute setup. |
| Age verification checkbox | Privacy Policy states 16+ minimum age. Registration form has no confirmation checkbox — compliance is text-only. Add required `ageConfirmed` checkbox to register form (web + mobile). No DB change needed. |
| File upload MIME type validation | `/api/upload` accepts files without server-side MIME type verification. A client can send `malicious.exe` with `Content-Type: image/jpeg`. Add server-side allowlist: `['image/jpeg','image/png','image/webp','image/gif']` + max 5 MB size check before uploading to R2. |

---

### P2 – High Value (next sprint)

| Item | Description |
|------|-------------|
| Infrastructure cost model | Document free tier limits and projected cost at 1k/10k users for: Neon, Netlify, Upstash, Resend, Anthropic, Cloudflare R2. Required before any partner conversation. |
| Feed privacy fix | `GET /api/feed` does not filter out private profiles — if a user posts then switches to private, their feed events remain visible. Fix: add JOIN to `profiles` + filter `WHERE profiles.is_public = true` in the read query. ~20 lines. GDPR concern. |
| Push notifications (mobile) | `push_tokens` table exists and Expo tokens are collected, but no push is ever sent. Users install the app, grant notification permission, and receive nothing. Integrate `expo-server-sdk` and trigger pushes on: new DM, reservation approved/rejected, skill request accepted. |
| Gamification balance | Points awarded only on `skill_request` completion — tools, food, events, drives award zero points. Fix: +5 pts on `tool_reservation → returned`, +3 pts on `food_reservation → picked_up`, +1 pt on event RSVP. Add 4 new badges: `first_event`, `first_drive`, `good_neighbor` (5 food shares), `tool_master` (3 tool loans). |
| Admin: report → content action | Reports page marks as "reviewed" but does not remove content. Add "Unpublish" action per report type: sets `skills.status='retired'`, `tools.deletedAt=now()`, `food_shares.deletedAt=now()` etc. Admins currently have no fast content removal path. |

---

### P3 – Planned

| Item | Description |
|------|-------------|
| Referral / invite system | "Invite your neighbor" — unique link per user, `referrals` table, points awarded on successful registration. Highest-ROI growth mechanic for community apps. |
| Streak / re-engagement mechanics | "You haven't shared in 3 weeks" notification or streak counter for dormant users. |
| Mobile: Ratings flow | `RatingModal` component + trigger from completed request/reservation cards + public profile reviews section. Same data as web, mobile-specific flow. |
| i18n remaining web pages | All module pages (skills, tools, events, drives, food, profile, notifications, leaderboard). Auth pages done. next-intl infrastructure is done — just needs `useTranslations()` wired per page. Translation keys already exist in `en.json` / `bg.json`. my-reservations returnBy field done. |
| Mobile i18n full implementation | Replace `packages/mobile/lib/i18n.ts` stub with `i18next` + `expo-localization`. EN/BG message files. Read locale from `Localization.locale`. |
| Mobile: Create + Edit Tool screens | `tools/new.tsx` and `tools/edit/[id].tsx` do not exist. Mobile users can browse and reserve tools but cannot list their own. |
| Mobile: Edit Event + Edit Drive screens | `events/edit/[id].tsx` and `drives/edit/[id].tsx` do not exist on mobile. |
| Mobile: Achievements / Badges screen | `profile/achievements.tsx` does not exist. Badges and user stats are invisible to mobile users. |
| Mobile leaderboard screen | Web leaderboard exists; mobile has no equivalent. |
| Mobile map: wire live API | Mobile map tab uses static/demo markers. Wire to live `GET /api/map`. |
| Mobile: endorsements UI | Skill endorsement API (POST/DELETE /api/skills/[id]/endorse) is done. Web EndorseButton exists. Mobile skill detail screen is missing endorsement count badge and the endorse action. |
| Mobile: block / report UI | Block and report APIs exist. No UI surface on mobile — users cannot block or report from the app. Safety-critical gap for a community platform. |
| Mobile: offline state | `OfflineResponse` with status 503 is returned on network error, but UI shows a generic error instead of a clear "No internet connection" state with retry. |
| Mobile: deep links | Email links (reservation approved, skill request accepted) open the web app. Mobile users are not redirected to the native app. Expo supports Universal Links / App Links. |
| "Near me" search | `GET /api/search` filters by `locationId` (dropdown) but not by distance. Add `lat/lng/radius` params and PostgreSQL `earthdistance` haversine filter. Neon has the extension built-in. Core feature for a neighborhood-based platform. |
| Map clustering + bounding box | Map endpoint returns up to 500 markers with no clustering. At scale, dense neighborhoods cause browser rendering bottleneck. Add `?bbox=north,south,east,west&zoom=N` — at low zoom return neighborhood aggregate counts; at high zoom return individual markers within bbox. |
| Pending request auto-expire | `pending` skill requests, tool reservations, and food reservations have no timeout — they stay pending forever. Add nightly job `POST /api/admin/expire-stale`: auto-cancel items older than 7 days, notify both parties. |
| Weekly digest email | Resend is integrated but sends only transactional emails. Add a weekly Sunday email: "This week in your neighborhood" — new skills nearby, upcoming events, top contributor. Proven D30 retention mechanic for community apps. Needs: email template + cron trigger. |
| Saved searches / alerts | Add `saved_searches` table (userId, query, types, locationId). Daily job: re-run saved searches → email user if new results appeared since last run. Converts passive visitors into active returning users. |
| New user onboarding flow | After registration + email verify, new user lands on empty page. Add guided first-use: "Complete your profile", "Browse skills near you", "Post your first skill". Empty state with illustration + CTA on all list pages. |
| Rating prompt after completion | After `skill_request → completed`, user receives no prompt to rate. Add in-app notification + optional modal: "How was your exchange with [Name]?" to increase rating completion rate. |
| Event cancellation notification | When an organizer cancels an event, attendees should receive in-app notification + email. The notification type likely exists in schema but the trigger may not be wired from the cancel endpoint. Verify and add. |
| Drive pledge: volunteer time type | `drive_type` enum is `items/money/food/other`. "Volunteer time" is a major category for NGOs and is not represented. Add `volunteer` to the enum (requires migration). |
| Admin: user search + filter | Admin `/admin/users` page has no search field — finding a specific user requires paginating through all 50-per-page results. Add server-side search by email/name and filter by role/status. |
| Organizer dashboard | Event and drive organizers have no way to see attendance stats, pledge counts, or engagement data for their own content. Add a "My Events" / "My Drives" stats view visible to organizers. |
| Data breach incident response plan | Document KZLD 72-hour notification procedure (GDPR Art. 33). Private ops runbook. |
| Orphan cleanup job | ✅ Done — `POST /api/admin/cleanup-orphans` added to admin maintenance panel. Covers notifications. ratings and feed_events cleanup are future work. |

---

### P4 – Design & UX Polish

| Item | Description |
|------|-------------|
| Brand typography | ✅ Done — Inter font via `next/font/google` with latin + cyrillic subsets. |
| CTA color differentiation | ✅ Done — Primary action buttons changed to `emerald-600`; nav hovers remain `green-700`. |
| Accessibility violations (color-contrast) | **text-gray-400 (#99a1af)** on white bg does not meet WCAG 2.1 AA (current 2.6:1, need 4.5:1). Affects: footer text, "by Owner" metadata, all footer links. Requires Tailwind palette upgrade or component refactoring. |
| Accessibility violations (link-in-text-block) | On /login and /register, "Sign in"/"Sign up" links lack visual distinction from surrounding text. Need underline or font-weight change. |
| Accessibility pass (WCAG 2.1 AA) | Systematic `aria-label`, `aria-expanded`, focus management audit. EN 301 549 EU standard applies in Bulgaria. |
| App Store submission materials | Screenshots EN + BG, descriptions, content rating forms, Google Play Data Safety form. Hard blocker for store submission. |
| Calendar export | `.ics` / Google Calendar deep-link on event detail and confirmed reservations. Standard UX expectation. |
| AI chat content guardrails | ✅ Done — "not professional advice" disclaimer added to system prompt; off-topic topics restricted. |
| Mobile build verification in CI | Add EAS build dry-run or `expo export` step to CI. Currently only typecheck runs — bundling errors not caught. |
| JWT key rotation procedure | Document: bump token version counter in DB → force logout all sessions → rotate `JWT_SECRET` env var. |
| Audit log append-only sink | Critical audit events written to a table a compromised admin could delete. Add separate table with `REVOKE DELETE` or external structured log sink. |
| Event waitlist | `event_waitlist` table with ordered position + auto-promotion when an attendee cancels. `maxCapacity` currently hard-rejects over-capacity RSVPs. |
| Tool return date enforcement | ✅ Done — `returnBy` nullable column added to `tool_reservations`. Overdue notification trigger is future work. |
| Skill endorsements | ✅ Done — schema + API (POST/DELETE /api/skills/[id]/endorse). UI pending. |
| Bulk dismiss notifications | ✅ Done — `POST /api/notifications/read-all` endpoint + "Mark all as read" button on notifications page. |
| User home neighborhood | ✅ Done — `defaultLocationId` FK added to `profiles`. Location picker UI and pre-filter wiring are future work. |
| Pagination variable standardization | ✅ Done — Feed standardized to page/limit. All routes now consistent. |
| reserve-button.tsx i18n | ✅ Done — `reserve_return_by_label` key added to tools namespace; hardcoded string removed. |
| Skill endorsements UI | ✅ Done — endorsementCount badge in dl grid + EndorseButton client component on skill detail page. |
| EndorseButton retry on error | Error state shows "Failed. Try again." but has no retry button — component is stuck until page refresh. Add a retry handler that resets state to 'idle'. |
| Real-time DMs (SSE) | Messages use 15-second REST polling — 15s latency before a new message appears. Interim fix (1 line): reduce `refetchInterval` from 15 000 → 3 000 ms. Full fix: Server-Sent Events on `GET /api/conversations/[id]/stream`. |
| Badge / level-up notifications | No in-app or push notification when a badge is unlocked or level is reached. `checkAndAwardBadges()` inserts silently. Add `createNotification()` after each badge insert + push trigger for mobile. |
| Dispute resolution | After `skill_request → cancelled`, add structured dispute flow with reason + evidence. Admin receives full request context (not a blind report) and can award partial points or issue a warning. |
| Empty states for new users | Skills, tools, food, events list pages show blank when empty — no illustration, no CTA, no guidance. Add per-page empty states: "Be the first to share a skill in your neighborhood!" |
| Recurring events | Organizers creating weekly/monthly events must duplicate manually each time. Add `recurrenceRule` field and auto-generate future event instances. Requires schema change. |
| Food expiry countdown | `food_shares.availableUntil` shows a static timestamp. Show "Expires in 2 hours" countdown on listing cards for urgency. Client-side only. |
| Contact form tracking | Contact form submissions are emailed but not stored in DB. Admin cannot see submission history or track which are answered. Add `contact_submissions` table. |
| Data retention automation | Privacy Policy commits to: accounts hard-purged after 30 days of soft-delete, AI messages deleted after 12 months, audit log after 24 months. No scheduled job enforces this. Add nightly cleanup endpoint or n8n workflow. |
| Cookie consent actually blocks PostHog | Privacy Policy states PostHog is off by default. Verify that declining cookies actually prevents the PostHog script from loading (conditional `<Script>` based on consent state). |
| PostHog event tracking | PostHog is installed but likely not tracking product events. Add: `skill_requested`, `tool_reserved`, `food_shared`, `event_rsvp`, `search_performed` events. Without these, no funnel data exists. |

---

### P5 – Future / Deferred

| Item | Description |
|------|-------------|
| Profile PUT partial update | PUT `/api/profile` clears any field not explicitly sent (all fields default to null). Introduce PATCH semantics so callers can update individual fields without resending the full profile. |
| Mutation testing (Stryker) | Run Stryker on `lib/state-machine.ts` + `lib/badges.ts` to verify tests actually catch regressions. |
| SAST — Semgrep / CodeQL | Static analysis for SQL injection, XSS, JWT bypass. GitHub Actions job. |
| Pen tester engagement | Active pentest: JWT algo confusion, mass assignment, SSRF via imageUrl, R2 enumeration. Code review is not a substitute. |
| Gamification redesign | Variable points by complexity, streak mechanics, neighborhood contribution score. Calibrate on real user data. |
| Flat point system redesign | All exchanges award equal points regardless of complexity. Redesign when data is available. |
| Referral incentive fine-tuning | A/B test incentive sizes + messaging after referral system (P3) ships. |
| TanStack Query Wave F | Full query migration for food, tools, events on web. Low urgency — all modules stable. |
| Landing page visual rebrand | Hero illustration, testimonials, product screenshots. Post-launch with real users. |
| Shared `packages/shared` types | Shared package for `MapMarker`, `FoodShare`, `ToolReservation` between web and mobile. Eliminates drift. |
| Hourly time slots for tool reservations | Date + time slot (10:00–12:00) for tool handoff coordination. Requires schema change. |
| Multiple images per listing | `attachments` table for multiple images per skill/tool/food/event listing. |
| ISR for public pages | List pages read `searchParams` (opts into dynamic) and home reads `cookies()` — ISR doesn't apply without first refactoring filtering to client-side. Revisit if DB load becomes a real issue at scale. |
| Suspense intra-page streaming | Route-level `loading.tsx` already covers the main UX win. Intra-page `<Suspense>` adds marginal benefit since all data sources are Neon (similar latency). Worth revisiting only if a specific page becomes measurably slow. |
| Semantic search (pgvector) | Current search is purely lexical — "уроци по Python" won't find "програмиране за начинаещи". Neon supports `pgvector`. On skill/tool CREATE generate embedding (Anthropic `text-embedding-3-small`) and store in `vector(1536)` column. Search uses hybrid ts_rank + cosine similarity. |
| Materialized search vectors | `plainto_tsquery()` computed on every search request. Add `search_vector tsvector GENERATED ALWAYS AS (...) STORED` column to skills, tools, events, drives, food_shares. Index with GIN. |
| CI/CD pipeline (GitHub Actions) | No `.github/workflows/*.yml` exists. Builds, tests, and deployments are manual. Add: typecheck → unit tests → integration tests → Playwright E2E → deploy to Netlify on merge to master. |
| D7 / D30 retention dashboard | Admin shows registrations for 7 days but not retention. Add: "Of users registered last week, how many are active today?" Critical for measuring product-market fit. |
| Skill request conversion funnel | No visibility into: skills viewed → skill requested → request accepted → completed. Without this funnel, the core value proposition cannot be measured or optimized. |
| Drive pledge export | NGOs need to export pledge lists for donor reporting or regulatory compliance. Add CSV/JSON export on the drive detail page for organizers. |

---

## Technical Backlog

> Engineering-focused items — architecture, refactor, and backend correctness. Use this when choosing the next technical task without scanning the full product backlog.

### P3

| Item | Domain | Description |
|------|--------|-------------|
| **DB schema drift: defaultLocationId** | **Migration** | **`profiles` table schema in Drizzle has `defaultLocationId` but DB migration never ran.** `POST /api/auth/register` fails on all E2E tests. Run `cd packages/nextjs && npx drizzle-kit generate && npx drizzle-kit migrate` to fix. Blocks E2E test suite. |
| Contract tests expansion | QA | ✅ Done — Integration tests added for tools, food, events, drives, auth, admin (refresh token, audit log). |
| E2E — full skill exchange cycle | QA | Playwright: create skill → request → accept → complete → rate. Full happy path across 5 API calls. [Blocked by DB schema drift — `defaultLocationId` migration not run]. |
| E2E — tool + food cycles | QA | ✅ Done — `e2e/tool-cycle.spec.ts` and `e2e/food-cycle.spec.ts` added. Blocked by DB schema drift until migration runs. |
| Accessibility tests (axe-core) | QA | ✅ Done — `e2e/accessibility.spec.ts` scans 6 public routes for WCAG 2.1 AA critical/serious violations. Known failures documented in P4 backlog. |
| Negative / error path smoke tests | QA | 401 on unauth requests, 403 on wrong-user mutations, 409 on duplicate reservation, 422 on invalid state transitions — all modules. |
| Rate-limit smoke test | QA | Fire N+1 rapid requests → assert 429. Verifies Upstash wiring in production. |
| Tool reservation TOCTOU | Backend | `POST /api/tool-reservations` checks `tool.status='available'` then inserts without atomic guard. Two concurrent requests can both pass the check before either commits. Low risk in MVP (one borrower per tool), but needs atomic SQL guard at scale. |
| Missing DB indexes | Performance | `feed_events.actorId` — no index, "my feed contributions" query is a full scan. `skill_requests (userFromId, status)` and `(userToId, status)` — common dashboard queries lack composite indexes. `messages.senderId` — "messages I sent" query is a full scan. |
| `drive_pledges` missing amount field | Schema | `community_drives.currentAmount` cannot be computed from pledges — `drive_pledges` has only text `pledgeDescription`, no numeric `amount`. The two are disconnected; `currentAmount` must be updated manually. Add `amount integer` to `drive_pledges` and auto-aggregate via query or trigger. |
| `push_tokens.platform` should be enum | Schema | `platform` is `varchar(16)` with no validation — any string can be stored. Change to `varchar CHECK (platform IN ('ios', 'android', 'web'))` or a proper Drizzle enum. Prevents invalid values before push notification service is wired up. |
| Token refresh race condition | Security | ✅ Done — `refreshInFlight` promise mutex added to `src/lib/api.ts` and `packages/mobile/lib/api.ts`. Concurrent 401s now share one refresh instead of each firing independently. |
| `state-machine.ts` orphaned utility | Refactor | `validateTransition()` in `src/lib/state-machine.ts` is defined and tested but never called from any route handler. State transitions are validated inline per-route instead. Decision: (a) refactor all routes to use the centralized utility, or (b) delete it and keep inline validation. Currently both approaches coexist. |
| Pagination default inconsistency | Backend | `queryFoodShares()` and `queryDrivePledges()` in `src/lib/queries/` default to 100 items; all other queries default to 50. Standardize to 50 across the board. |
| Missing email notifications | Backend | No email sent for: tool reservation approved/rejected, event RSVP confirmed, drive pledge accepted/fulfilled. Users rely on in-app notifications only for these transitions — email adds reliability and re-engagement. |
| `CONTACT_EMAIL` undocumented | Ops | ✅ Done — Added to `.env.example` with comment. |
| DB table count in AGENTS.md | Docs | ✅ Done — Updated to 28 tables with full table list. |
| `profiles.avgRating` auto-sync | Schema | `profiles.avgRating` and `ratingCount` can drift from actual `ratings` table values if a rating is edited or deleted. `POST /api/admin/recalc-ratings` exists but is manual. Add trigger or call recalc automatically on rating insert/update/delete. |
| `events.startsAt < endsAt` DB constraint | Schema | When `endsAt` is provided, no CHECK constraint enforces `startsAt < endsAt` at the DB level. Zod schema validates this, but a direct SQL INSERT can violate the invariant. |
| Unbounded temporal table archival | DB | `audit_log`, `feed_events`, `messages` grow indefinitely. At 1 000 active users with 10 actions/day → 3.6M audit rows/year. Define retention window and add nightly archival/deletion job. |

### P4

| Item | Domain | Description |
|------|--------|-------------|
| Visual regression tests | QA | Playwright `page.screenshot()` baselines for home, skills list, food list. Compare on each PR. |
| Performance baseline (k6) | QA / SRE | k6 script targeting main list endpoints — establish p95 latency at 50 VU before/after DB index changes. |
| Mobile unit tests | QA | Vitest/Jest for `packages/mobile/lib/` — state hooks, formatting utils. Zero test coverage on mobile package. |
| Home page caching | Performance | Home page is `force-dynamic` — full DB queries on every request. Add 60-second `stale-while-revalidate` cache header or Redis cache for categories and locations (rarely change). Reduces DB load ~90% on the most visited page. |
| Password strength policy | Security | Registration accepts any 8-character password. Add: check against top-1000 common passwords list, recommend passphrase UX. NIST 2024 guidelines prefer length over complexity, but min 8 is low. |

---

## Long-Term Vision (Post-Launch, 12+ months)

> These items are deliberately excluded from the near-term backlog. They require validated user traction, real usage data, or significant infrastructure investment before they make sense to build. Do not promote to P1–P5 without a concrete trigger (e.g. 1 000 active users, App Store submission, partner deal).

### Trust & Safety

| Item | Description |
|------|-------------|
| Phone number verification | Email verification is bypassable with temp-mail services. Add optional phone verification via SMS (Twilio/Vonage) to unlock a "Verified" badge. Required before any significant growth push. |
| Neighborhood address verification | Users can claim to be from any neighborhood. Postcard-with-code flow (physical mail to address) or address API cross-check. Prerequisite for high-trust exchanges (tools, in-person skills). |
| Identity verification | Full ID check (national ID scan) for premium/business accounts. Necessary for high-value or high-trust use cases. |
| DPIA (Data Protection Impact Assessment) | GDPR Art. 35 may require a DPIA when processing location data of users at scale. Document when user count reaches a threshold requiring formal assessment. |

### Monetization Infrastructure

| Item | Description |
|------|-------------|
| Subscription tier in schema | Add `subscription_tier varchar` to `users` (free / premium / business). Easier to add early than to migrate 28 tables later. No features gated yet — just the column. |
| Featured listings | `is_featured boolean` on skills/tools/events. Featured items appear first in search and lists. Basis for sponsored content revenue. |
| Billing integration | Stripe or Paddle integration for Premium subscriptions. Build only when subscription tiers are defined and user demand is validated. |
| Business / organizer accounts | Dedicated analytics dashboard, API access, bulk listing management, white-label options. Long-term B2B revenue track. |

---

## Product Vision

### User Segments
| Segment | Description |
|---------|-------------|
| Individuals | Regular neighbors and citizens |
| Organizers | Event and campaign organizers |
| Charity | Non-profit organizations and volunteers |
| Businesses | Local businesses and partners |

### Business Model
- **Freemium** — Free core + Premium (AI features, analytics, API)
- **Ad-based** — Local businesses, sponsored content
- **Subscription** — Monthly/yearly for organizers and businesses
- **Partnerships** — NGOs, municipalities, media

### Notes and Risks
- Map on mobile is non-trivial — `react-native-maps` requires separate integration
- Location is neighborhood-level only (no exact address) — GDPR considerations
- Empty state for new users: `npm run db:seed` populates demo locations, categories, users, skills, and requests
- AI integration is a course priority (Week 3), not "after all modules"
