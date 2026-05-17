# Neighborhood Hub – Roadmap

> Last updated: 2026-05-17 (P1 closed, new architect findings added to P2/P3)

---

## Column Legend

| Column | Values | Meaning |
|--------|--------|---------|
| **Type** | Feature · Security · Bug · Infra · Docs · UX · QA · Refactor · Schema · Legal | Category of work |
| **Difficulty** | Easy · Medium · Hard | Technical complexity — Easy = clear spec + existing pattern, Medium = some judgment needed, Hard = architecture decisions or new territory |
| **Risk** | Low · Med · High | Implementation risk — chance of regression or breaking existing functionality if done wrong |
| **Effort** | S · M · L · XL · XXL | S ≈ 1-2h · M ≈ 4-8h · L ≈ 1-2d · XL ≈ 3-5d · XXL ≈ 1-2wk |
| **Copilot** | ✅ · — | ✅ = mechanical task suitable for a weaker AI agent (Copilot, GPT-4o mini); — = requires Claude (security judgment, architecture, complex cross-system changes) |

> **Good-practice columns not shown here (consider adding when team grows):**
> - **Impact** (High / Med / Low) — estimated user-facing business value, helps compare ROI across items
> - **Depends on** — explicit blockers between items so you can sequence correctly
> - **Status** (Not Started · Blocked · In Progress) — for active sprint tracking
> - **Owner** — who is responsible for delivery

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

### P1 – Critical (blockers / active violations)

| Item | Type | Difficulty | Risk | Effort | Copilot | Description |
|------|------|-----------|------|--------|---------|-------------|
| DB schema drift: defaultLocationId | Bug | Easy | Low | S | ✅ | ✅ Done — Migration 0026 ran against production 2026-05-17. `profiles.defaultLocationId` column now live. |
| Feed privacy GDPR fix | Security | Medium | High | M | — | ✅ Done — `GET /api/feed` now inner-joins `profiles` and filters `isPublic = true`. Private profile events no longer visible. Fixed 2026-05-17. |
| Cookie consent actually blocks PostHog | Legal | Medium | High | M | — | ✅ Done — PostHog provider uses `opt_out_capturing_by_default: true`. No data sent until user explicitly calls `opt_in_capturing()` via consent banner. |
| File upload MIME type validation | Security | Medium | High | M | — | ✅ Done — MIME allowlist + magic byte validation for JPEG/PNG/WebP + 5 MB cap implemented in `/api/upload/route.ts`. |
| Age verification checkbox | Legal | Easy | Low | S | ✅ | ✅ Done — Required `ageConfirmed` checkbox added to web register form (`register/page.tsx`). Blocks form submit if unchecked. Mobile pending. |
| Privacy Policy URL for App Store | Legal | Easy | Low | S | ✅ | Apple + Google reject apps without a live Privacy Policy URL. Blocker for both store submissions. Add once domain is confirmed and page is publicly hosted. |
| Uptime monitoring | Infra | Easy | Low | S | ✅ | No external monitor — downtime is discovered by users, not the team. Add UptimeRobot or Betterstack free tier pointing to `GET /api/health`. 10-minute setup. |

---

### P2 – High Value (next sprint)

| Item | Type | Difficulty | Risk | Effort | Copilot | Description |
|------|------|-----------|------|--------|---------|-------------|
| CI/CD pipeline (GitHub Actions) | Infra | Medium | Low | L | ✅ | ✅ Done — `.github/workflows/ci-smoke.yml` runs typecheck + unit + integration + Playwright. Netlify auto-deploys from master via GitHub integration. |
| Cross-module search UX | UX/Feature | Medium | Low | M | — | `GET /api/search` exists but results are siloed per module. Searching "ladder" should return tools + skills + food in one ranked view. First thing any evaluator will try — no result across modules signals a feature gap. |
| Tool date-overlap enforcement | Bug | Easy | High | S | ✅ | Two users can book the same tool for overlapping dates — no server-side overlap check exists in `POST /api/tool-reservations`. Add exclusion query before insert. First real-world dispute trigger. |
| Data retention automation | Legal/Infra | Medium | Med | L | — | Privacy Policy commits to: accounts hard-purged 30 days after soft-delete, AI messages deleted after 12 months, audit log after 24 months. No scheduled job enforces any of this. Add nightly cleanup endpoint or n8n workflow. |
| Push notifications (mobile) | Feature | Hard | Med | XL | — | `push_tokens` table exists and Expo tokens are collected, but no push is ever sent. Users install the app, grant notification permission, and receive nothing. Integrate `expo-server-sdk` and trigger on: new DM, reservation approved/rejected, skill request accepted. |
| Gamification balance | Feature | Medium | Low | L | — | Points awarded only on `skill_request` completion — tools, food, events, drives award zero points. Add: +5 pts on tool returned, +3 pts on food picked_up, +1 pt on event RSVP. New badges: `first_event`, `first_drive`, `good_neighbor` (5 food shares), `tool_master` (3 tool loans). |
| Admin: report → content action | Feature | Medium | Med | L | — | Reports page marks as "reviewed" but cannot remove content. Add "Unpublish" action per report type: sets `skills.status='retired'`, `tools.deletedAt=now()`, `food_shares.deletedAt=now()`. Admins currently have no fast content removal path. |
| Infrastructure cost model | Docs | Easy | Low | M | ✅ | Document free tier limits and projected cost at 1k/10k users for: Neon, Netlify, Upstash, Resend, Anthropic, Cloudflare R2. Required before any partner conversation. |

---

### P3 – Planned

| Item | Type | Difficulty | Risk | Effort | Copilot | Description |
|------|------|-----------|------|--------|---------|-------------|
| Event cancellation notification | Bug/Feature | Easy | Low | S | ✅ | ✅ Done — Both PATCH (cancel) and DELETE on `events/[id]/route.ts` query all `eventAttendees` with status 'attending' and call `createNotification({ type: 'event_cancelled' })` for each. Push notification also fires via `sendPushNotification`. |
| Drive pledge: volunteer time type | Feature | Easy | Low | S | ✅ | `drive_type` enum is `items/money/food/other`. "Volunteer time" is a major NGO category not represented. Add `volunteer` to the enum (requires migration). |
| Mobile: endorsements UI | Feature | Easy | Low | S | ✅ | ✅ Done — `packages/mobile/app/(app)/skills/[id].tsx` has endorsement count display, endorse/un-endorse toggle with optimistic update, hidden for own skills. |
| Admin: user search + filter | Feature | Easy | Low | M | ✅ | Admin `/admin/users` has no search field — finding a specific user requires paginating through all results. Add server-side search by email/name and filter by role/status. |
| Mobile: Achievements / Badges screen | Feature | Easy | Low | M | ✅ | `profile/achievements.tsx` does not exist on mobile. Badges and user stats are invisible to mobile users. |
| Mobile leaderboard screen | Feature | Easy | Low | M | ✅ | Web leaderboard exists; mobile has no equivalent screen. |
| Mobile: offline state | UX | Easy | Low | M | ✅ | `OfflineResponse` 503 is returned on network error, but the UI shows a generic error. Replace with a clear "No internet connection" state with a retry CTA. |
| Mobile: block / report UI | Feature | Easy | Low | M | ✅ | Block and report APIs exist. No UI surface on mobile — users cannot block or report from the app. Safety-critical gap for a community platform. |
| Rating prompt after completion | UX | Easy | Low | M | ✅ | After `skill_request → completed`, user receives no prompt to rate. Add in-app notification + optional modal: "How was your exchange with [Name]?" to increase rating completion rate. |
| PostHog event tracking | Infra | Easy | Low | M | ✅ | PostHog is installed but likely not tracking product events. Add: `skill_requested`, `tool_reserved`, `food_shared`, `event_rsvp`, `search_performed`. Without these, no funnel data exists. |
| Data breach incident response plan | Docs | Easy | Low | S | ✅ | Document KZLD 72-hour notification procedure (GDPR Art. 33). Private ops runbook. |
| i18n remaining web pages | Feature | Easy | Low | L | ✅ | All module pages (skills, tools, events, drives, food, profile, notifications, leaderboard). Auth pages done. next-intl infrastructure done — just needs `useTranslations()` wired per page. Keys exist in `en.json` / `bg.json`. |
| Mobile: Ratings flow | Feature | Medium | Low | L | — | `RatingModal` component + trigger from completed request/reservation cards + public profile reviews section. Same data as web, mobile-specific flow. |
| Mobile: Create + Edit Tool screens | Feature | Medium | Low | L | — | `tools/new.tsx` and `tools/edit/[id].tsx` do not exist on mobile. Users can browse and reserve tools but cannot list their own. |
| Mobile: Edit Event + Edit Drive screens | Feature | Medium | Low | L | — | `events/edit/[id].tsx` and `drives/edit/[id].tsx` do not exist on mobile. |
| Mobile map: wire live API | Feature | Medium | Med | M | — | Mobile map tab uses static/demo markers. Wire to live `GET /api/map`. |
| Mobile i18n full implementation | Feature | Medium | Low | L | ✅ | Replace `packages/mobile/lib/i18n.ts` stub with `i18next` + `expo-localization`. EN/BG message files. Read locale from `Localization.locale`. |
| New user onboarding flow | UX | Medium | Low | L | ✅ | After registration + email verify, new user lands on an empty page. Add guided first-use: "Complete your profile", "Browse skills near you", "Post your first skill" with illustrations + CTAs on all empty list pages. Users who don't post within 48h churn at 3-5x (Nextdoor internal data). |
| `users.lastActiveAt` signal | UX/Schema | Easy | Low | S | ✅ | No recency signal on profiles or listings. Users can't tell if a skill/tool offer is from an active neighbor or a dormant account — main reason they won't initiate contact. Add `lastActiveAt` column updated on token refresh, display "Active X days ago" on profile + listing cards. |
| `drive_pledges.amount` schema fix | Schema/Bug | Easy | Low | S | ✅ | `community_drives.currentAmount` is manually maintained with no source of truth in pledges. Progress bar is untrustworthy for real charity drives. Add `amount integer nullable` to `drive_pledges`, compute `currentAmount` via aggregate on read. |
| Community health stats on homepage | UX/Feature | Easy | Low | S | ✅ | Landing page has no activity signal. One aggregate query (total skills + tools + food + events in user's city) displayed in the hero converts skeptics into signups by demonstrating platform vitality. |
| Organizer dashboard | Feature | Medium | Low | L | — | Event and drive organizers have no way to see attendance stats, pledge counts, or engagement for their own content. Add a "My Events" / "My Drives" stats view visible to organizers. |
| Pending request auto-expire | Feature/Infra | Medium | Med | L | — | `pending` skill requests, tool reservations, and food reservations have no timeout — they stay pending forever. Add nightly job: auto-cancel items older than 7 days, notify both parties. |
| Weekly digest email | Feature | Medium | Low | L | — | Resend is integrated but sends only transactional emails. Add a weekly Sunday digest: "This week in your neighborhood" — new skills nearby, upcoming events, top contributor. Proven D30 retention mechanic for community apps. |
| Mobile: deep links | Infra | Medium | Low | L | — | Email links (reservation approved, skill request accepted) open the web app even when the native app is installed. Implement Universal Links / App Links via Expo so email CTAs route to the native app. |
| "Near me" search | Feature | Hard | Med | XL | — | `GET /api/search` filters by `locationId` (dropdown) but not by distance. Add `lat/lng/radius` params and PostgreSQL `earthdistance` haversine filter. Neon has the extension built-in. Core feature for a neighborhood-based platform. |

---

### P4 – Design & UX Polish

| Item | Type | Difficulty | Risk | Effort | Copilot | Description |
|------|------|-----------|------|--------|---------|-------------|
| EndorseButton retry on error | Bug/UX | Easy | Low | S | ✅ | Error state shows "Failed. Try again." but has no retry button — component is stuck until page refresh. Add a retry handler that resets state to 'idle'. |
| Food expiry countdown | UX | Easy | Low | S | ✅ | `food_shares.availableUntil` shows a static timestamp. Show "Expires in 2 hours" countdown on listing cards for urgency. Client-side only — no API change needed. |
| Accessibility violations (color-contrast) | UX/Legal | Easy | Low | S | ✅ | `text-gray-400` on white bg: 2.6:1 contrast ratio (need 4.5:1 for WCAG AA). Affects footer text, metadata labels, footer links. Tailwind palette upgrade or component refactor. |
| Accessibility violations (link-in-text-block) | UX | Easy | Low | S | ✅ | On /login and /register, "Sign in"/"Sign up" links lack visual distinction from surrounding text. Add underline or font-weight change. |
| JWT key rotation procedure | Docs/Security | Easy | Low | S | ✅ | Document: bump token version counter in DB → force logout all sessions → rotate `JWT_SECRET` env var. |
| Password strength policy | Security | Easy | Low | S | ✅ | Registration accepts any 8-character password. Add check against top-1000 common passwords list. NIST 2024 recommends length over complexity, but rejecting trivial passwords is baseline hygiene. |
| Badge / level-up notifications | Feature | Easy | Low | M | ✅ | No notification when a badge is unlocked or level reached. `checkAndAwardBadges()` inserts silently. Add `createNotification()` after each badge insert + push trigger for mobile. |
| Empty states for new users | UX | Easy | Low | M | ✅ | Skills, tools, food, events list pages show blank when empty — no illustration, no CTA, no guidance. Add per-page empty states: "Be the first to share a skill in your neighborhood!" |
| App Store submission materials | Docs | Easy | Low | M | ✅ | Screenshots EN + BG, descriptions, content rating forms, Google Play Data Safety form. Hard dependency for store submission. |
| Calendar export | Feature | Easy | Low | M | ✅ | `.ics` / Google Calendar deep-link on event detail and confirmed reservations. Standard UX expectation. |
| Mobile build verification in CI | Infra/QA | Medium | Low | M | ✅ | Add EAS build dry-run or `expo export` step to CI. Currently only typecheck runs — bundling errors not caught until manual test. |
| Accessibility pass (WCAG 2.1 AA) | UX/QA | Medium | Low | L | — | Systematic `aria-label`, `aria-expanded`, focus management audit across all pages. EN 301 549 EU standard applies in Bulgaria. |
| Real-time DMs (SSE) | Feature | Hard | Med | XL | — | Messages use 15-second REST polling — 15s latency before a new message appears. Interim fix (1 line): reduce `refetchInterval` 15 000 → 3 000 ms. Full fix: Server-Sent Events on `GET /api/conversations/[id]/stream`. |
| Audit log append-only sink | Security/Infra | Hard | High | XL | — | Critical audit events written to a table a compromised admin could delete. Add separate table with `REVOKE DELETE` or external structured log sink (e.g. Axiom). |

---

### P5 – Future / Deferred

| Item | Type | Difficulty | Risk | Effort | Copilot | Description |
|------|------|-----------|------|--------|---------|-------------|
| Profile PUT partial update (PATCH) | Refactor/API | Medium | Med | M | — | PUT `/api/profile` clears any field not explicitly sent — all fields default to null. Introduce PATCH semantics so callers update individual fields without resending the full profile. |
| SAST — Semgrep / CodeQL | Security | Medium | Low | M | ✅ | Static analysis for SQL injection, XSS, JWT bypass. Add as a GitHub Actions job. Standard config is well-documented; Copilot can set it up. |
| TanStack Query Wave F | Refactor | Medium | Low | XL | — | Full query migration for food, tools, events on web. Low urgency — all modules stable and consistent. |
| Shared `packages/shared` types | Refactor | Medium | Low | L | — | Shared package for `MapMarker`, `FoodShare`, `ToolReservation` between web and mobile. Eliminates type drift between packages. |
| Pen tester engagement | Security | Hard | Low | XL | — | Active pentest: JWT algo confusion, mass assignment, SSRF via imageUrl, R2 enumeration. Code review is not a substitute for real penetration testing. |

---

## Technical Backlog

> Engineering-focused items — architecture, refactor, and backend correctness. Use this when choosing the next technical task without scanning the full product backlog.

### P3

| Item | Domain | Type | Difficulty | Risk | Effort | Copilot | Description |
|------|--------|------|-----------|------|--------|---------|-------------|
| `events.startsAt < endsAt` DB constraint | Schema | Bug | Easy | Low | S | ✅ | No CHECK constraint at DB level for `startsAt < endsAt`. Zod validates it, but a direct SQL INSERT can violate the invariant. |
| `push_tokens.platform` should be enum | Schema | Schema | Easy | Low | S | ✅ | `platform` is `varchar(16)` with no validation — any string can be stored. Change to `CHECK (platform IN ('ios', 'android', 'web'))` or a Drizzle enum before push notifications are wired up. |
| Pagination default inconsistency | Backend | Bug | Easy | Low | S | ✅ | `queryFoodShares()` and `queryDrivePledges()` default to 100 items; all other queries default to 50. Standardize to 50 across the board. |
| Rate-limit smoke test | QA | QA | Easy | Low | S | ✅ | Fire N+1 rapid requests → assert 429. Verifies Upstash wiring in production. |
| Missing DB indexes | Performance | Schema | Easy | Low | S | ✅ | `feed_events.actorId`, `skill_requests (userFromId, status)`, `(userToId, status)`, `messages.senderId` — all missing indexes. Common dashboard and feed queries are full table scans. |
| `drive_pledges` missing amount field | Schema | Bug | Medium | Low | M | — | `community_drives.currentAmount` cannot be computed from pledges — `drive_pledges` has only text `pledgeDescription`, no numeric `amount`. Add `amount integer` and auto-aggregate via query. |
| `state-machine.ts` orphaned utility | Refactor | Refactor | Medium | Low | M | — | `validateTransition()` defined and tested but never called from any route handler. State transitions are validated inline per-route instead. Decision: (a) refactor all routes to use the centralized utility, or (b) delete it and keep inline validation. Currently both approaches coexist. |
| `profiles.avgRating` auto-sync | Schema | Bug | Medium | Med | M | — | `profiles.avgRating` and `ratingCount` can drift from the `ratings` table if a rating is edited or deleted. `POST /api/admin/recalc-ratings` exists but is manual-only. Add automatic trigger or call recalc on rating insert/update/delete. |
| E2E — full skill exchange cycle | QA | QA | Medium | Low | M | — | Playwright: create skill → request → accept → complete → rate. Full happy path across 5 API calls. [Unblocked once DB schema drift migration runs — P1]. |
| Negative / error path smoke tests | QA | QA | Medium | Low | L | — | 401 on unauth requests, 403 on wrong-user mutations, 409 on duplicate reservation, 422 on invalid state transitions — all modules. |
| Missing email notifications | Backend | Feature | Medium | Low | L | — | No email sent for: tool reservation approved/rejected, event RSVP confirmed, drive pledge accepted/fulfilled. Users rely on in-app notifications only for these transitions — email adds reliability and re-engagement. |
| Unbounded temporal table archival | DB | Infra | Medium | Med | L | — | `audit_log`, `feed_events`, `messages` grow indefinitely. At 1 000 active users × 10 actions/day → 3.6M audit rows/year. Define retention window and add nightly archival/deletion job. |
| **next.config.ts regression** | Infra | Security | Easy | Low | S | ✅ | ✅ Fixed in milestone review 2026-05-15 — restored turbopack alias (i18n), Sentry wrapper, outputFileTracingRoot (Netlify), and connect-src PostHog/Sentry URLs that were accidentally stripped in refactor(ui) commit. |
| Profile page missing badges + time credits | Bug/UX | Medium | Low | M | — | Profile page converted to client component lost `TimeCreditCard` and `AchievementBadges` which required server-side DB data. `DangerZone` and `PointsBadge` were restored in milestone review. Restore time credits and badges by adding client-side data fetching or a dedicated `/api/me/profile-stats` endpoint. |
| Tool reservation TOCTOU | Backend | Security | Hard | High | L | — | `POST /api/tool-reservations` checks `tool.status='available'` then inserts without atomic guard. Two concurrent requests can both pass the check before either commits. Add `SELECT ... FOR UPDATE` atomic SQL guard. |
| Food quantity race condition | Backend | Security | Medium | High | M | — | `food_shares.quantity` is not decremented atomically when a reservation is approved. Two concurrent approvals can both succeed and over-commit. Decrement quantity in the same UPDATE that sets status to 'reserved', and check `quantity > 0` as part of the WHERE clause. |
| Tool date-overlap not enforced | Backend | Bug | Medium | Med | M | — | `tool_reservations_active_idx` prevents the same borrower from double-booking but does NOT prevent two different borrowers reserving the same tool for overlapping dates. Add an exclusion constraint or application-level overlap check on reservation creation. |
| `content_reports` orphan table | DB | Cleanup | Easy | Low | S | — | Production DB has `content_reports` table that is not defined in schema.ts or any migration. Likely a renamed predecessor of `reports` (migration 0015). Audit for any references, then drop it. |
| `skill_endorsements` CHECK constraint drift | Schema | Bug | Easy | Low | S | — | Table was created manually during schema-drift repair with an extra `skill_endorsements_skill_endorser_self_check` constraint not present in migration 0027 or schema.ts. Either add the check to schema.ts + generate a migration, or drop the constraint to eliminate drift. |

### P4

| Item | Domain | Type | Difficulty | Risk | Effort | Copilot | Description |
|------|--------|------|-----------|------|--------|---------|-------------|
| Home page caching | Performance | Performance | Medium | Med | M | — | Home page is `force-dynamic` — full DB queries on every request. Add 60-second `stale-while-revalidate` cache header or Redis cache for categories and locations (rarely change). Reduces DB load ~90% on the most visited page. |
| Mobile unit tests | QA | QA | Medium | Low | L | ✅ | Vitest/Jest for `packages/mobile/lib/` — state hooks, formatting utils. Currently zero test coverage on the mobile package. |

---

## Long-Term Vision (12+ months)

> Items deliberately excluded from the near-term backlog. They require validated user traction, real usage data, or significant infrastructure investment before they make sense to build. Do not promote to P1–P5 without a concrete trigger (e.g. 1 000 active users, App Store submission, confirmed partner deal).

### Growth & Engagement

| Item | Effort | Description |
|------|--------|-------------|
| Referral / invite system | XL | "Invite your neighbor" — unique link per user, `referrals` table, points awarded on successful registration. Highest-ROI growth mechanic for community apps. Build when user base is established. |
| Streak / re-engagement mechanics | L | "You haven't shared in 3 weeks" notification or streak counter for dormant users. Requires real behavioral data to calibrate thresholds. |
| Saved searches / alerts | XL | `saved_searches` table. Daily job: re-run saved searches → email user if new results appeared since last run. Converts passive visitors into returning users. |
| D7 / D30 retention dashboard | L | "Of users registered last week, how many are active today?" Critical for measuring product-market fit. Add only when user base is large enough to produce meaningful cohorts. |
| Skill request conversion funnel | L | No visibility into: skill viewed → requested → accepted → completed. Without this, the core value proposition cannot be measured or optimized. |
| Referral incentive fine-tuning | M | A/B test incentive sizes + messaging after referral system ships. Requires real user data. |
| Landing page visual rebrand | XL | Hero illustration, testimonials, product screenshots. Post-launch with real users. |

### Content & Organizers

| Item | Effort | Description |
|------|--------|-------------|
| Recurring events | XL | Organizers creating weekly/monthly events must duplicate manually each time. Add `recurrenceRule` field and auto-generate future event instances. Requires schema change. |
| Event waitlist | L | `event_waitlist` table with ordered position + auto-promotion when an attendee cancels. `maxCapacity` currently hard-rejects over-capacity RSVPs. |
| Dispute resolution | XXL | After `skill_request → cancelled`, add structured dispute flow with reason + evidence. Admin receives full request context and can award partial points or issue a warning. |
| Drive pledge export | M | NGOs need to export pledge lists for donor reporting or regulatory compliance. Add CSV/JSON export on the drive detail page for organizers. |
| Contact form tracking | M | Contact form submissions are emailed but not stored in DB. Admin cannot see submission history or track which are answered. Add `contact_submissions` table. |

### Technical Depth

| Item | Effort | Description |
|------|--------|-------------|
| Map clustering + bounding box | XL | Map returns up to 500 markers with no clustering. At scale, add `?bbox=north,south,east,west&zoom=N` — at low zoom return neighborhood aggregate counts; at high zoom return individual markers within bbox. |
| Semantic search (pgvector) | XXL | Current search is purely lexical — "уроци по Python" won't find "програмиране за начинаещи". Add embedding generation on CREATE + hybrid ts_rank + cosine similarity. Neon supports `pgvector`. |
| Materialized search vectors | L | `plainto_tsquery()` computed on every search request. Add `GENERATED ALWAYS AS` tsvector columns with GIN indexes on all searchable tables. Revisit if search latency becomes measurable. |
| Hourly time slots for tool reservations | XL | Date + time slot (10:00–12:00) for tool handoff coordination. Requires schema change. |
| Multiple images per listing | XL | `attachments` table for multiple images per skill/tool/food/event listing. |
| ISR for public pages | L | List pages read `searchParams` (opts into dynamic) — ISR doesn't apply without refactoring filtering to client-side. Revisit if DB load becomes a real issue at scale. |
| Suspense intra-page streaming | M | Route-level `loading.tsx` already covers the main UX win. Intra-page `<Suspense>` adds marginal benefit since all data sources are Neon (similar latency). Revisit only if a specific page becomes measurably slow. |
| Gamification redesign | XL | Variable points by complexity, streak mechanics, neighborhood contribution score. Calibrate on real user data after gamification balance (P2) ships. |
| Flat point system redesign | L | All exchanges award equal points regardless of complexity. Redesign when real usage data is available. |
| Visual regression tests | M | Playwright `page.screenshot()` baselines for key pages. Compare on each PR. Low priority until UI stabilizes post-launch. |
| Performance baseline (k6) | M | k6 script targeting main list endpoints — establish p95 latency at 50 VU before/after DB index changes. Run before first significant traffic. |
| Mutation testing (Stryker) | M | Run Stryker on `lib/state-machine.ts` + `lib/badges.ts` to verify tests actually catch regressions. |

### Trust & Safety

| Item | Effort | Description |
|------|--------|-------------|
| Phone number verification | XL | Email verification is bypassable with temp-mail services. Add optional phone verification via SMS (Twilio/Vonage) to unlock a "Verified" badge. Required before any significant growth push. |
| Neighborhood address verification | XXL | Users can claim any neighborhood. Postcard-with-code flow or address API cross-check. Prerequisite for high-trust exchanges (tools, in-person skills). |
| Identity verification | XXL | Full ID check (national ID scan) for premium/business accounts. Necessary for high-value or high-trust use cases. |
| DPIA (Data Protection Impact Assessment) | L | GDPR Art. 35 may require a DPIA when processing location data of users at scale. Document when user count reaches a threshold requiring formal assessment. |

### Monetization Infrastructure

| Item | Effort | Description |
|------|--------|-------------|
| Subscription tier in schema | S | Add `subscription_tier varchar` to `users` (free / premium / business). Easier to add early than to migrate 28 tables later. No features gated yet — just the column. |
| Featured listings | M | `is_featured boolean` on skills/tools/events. Featured items appear first in search and lists. Basis for sponsored content revenue. |
| Billing integration | XXL | Stripe or Paddle integration for Premium subscriptions. Build only when subscription tiers are defined and user demand is validated. |
| Business / organizer accounts | XXL | Dedicated analytics dashboard, API access, bulk listing management. Long-term B2B revenue track. |

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
