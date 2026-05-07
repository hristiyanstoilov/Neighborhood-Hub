# Neighborhood Hub – Roadmap

> Last updated: 2026-05-07

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

---

### P2 – High Value (next sprint)

| Item | Description |
|------|-------------|
| Nav information architecture | 11 top-level links at equal visual weight. Restructure: keep 5 core modules (Skills, Tools, Events, Drives, Food) visible; move Feed/Map/Radar/Leaderboard into a "Discover" dropdown; move Messages/AI Chat/Notifications/Profile into a right-side icon cluster with icons instead of text. |
| Reports / content flagging | `reports` table + admin moderation queue in `/admin`. Without this a single bad actor can post unlimited inappropriate listings with no removal path. |
| User blocking | Users coordinate physical meetups. Without blocking, harassment victims have no safe exit. Requires `blocks` table + enforcement in DM and listing APIs. |
| GDPR data export + hard purge | Art. 15/20: machine-readable JSON export of user's own data at `GET /api/account/export`. Art. 17: scheduled hard purge of soft-deleted accounts after 30 days. |
| Contact / support form | No contact path for disputes, bugs, or account issues. `/contact` page using Resend (already integrated). ~30 min implementation. |
| Onboarding flow | Users land on blank dashboard after registration with no guidance. Add first-login "what to do first" nudge or welcome email with suggested actions. |
| Points reinforcement feedback | Users earn points when requests complete but receive no in-moment signal. Add "+10 points!" toast at the reward moment. Closes broken reinforcement loop. |
| Leaderboard personal progress view | Absolute rank discourages users outside top 20%. Show "You are in the top 40% of your neighborhood this week" instead of "#47 of 50". Same data, better psychology. |
| Badge criteria visible to users | 7 badges with no visible criteria or progress. Add locked badge outlines + "Earn this by: completing 10 requests" text. Turns hidden achievements into visible goals. |
| AI chat timeout guard | Netlify free tier functions timeout at 10s. AI chat streaming can exceed this. Add `AbortController` (9s timeout) + `max_tokens` cap server-side. |
| Food safety acknowledgment | Checkbox at food share creation: "I confirm this food is safe for consumption." Frontend-only change. Closes both trust and liability gap. |
| Event edit page (web) | `/events/[id]/edit` does not exist. Event creators can only delete, never update after creation. |
| Cookie banner "Reject All" | GDPR requires equally prominent reject option. Add "Reject All" that writes `analytics=false` to `userConsents`. Current banner has Accept only. |
| Time-credit balance ("time wallet") | Show hours given/received on profile, derived from completed skill requests. Makes the time-banking value proposition visible and motivating. |
| Bound `queryDrivePledges` | No `.limit()` — returns all pledge rows. OOM crash risk at scale. Add `limit(100)` + page param; expose via `?page=` on `/api/drives/[id]/pledges`. |
| Bound `queryFoodReservations` | No `.limit()` — same crash risk. Add pagination. |
| Infrastructure cost model | Document free tier limits and projected cost at 1k/10k users for: Neon, Netlify, Upstash, Resend, Anthropic, Cloudflare R2. Required before any partner conversation. |

---

### P3 – Planned

| Item | Description |
|------|-------------|
| SEO meta tags on listing pages | `generateMetadata()` on `/skills/[id]`, `/tools/[id]`, `/events/[id]`, `/food/[id]` — unique `<title>` and `<meta description>` per listing. |
| Open Graph tags | `og:title`, `og:description`, `og:image` in same metadata pass. Sharing any listing on Viber/Messenger currently shows no preview. |
| sitemap.xml | `app/sitemap.ts` generating URLs for all public listing pages. ~1 hour in Next.js App Router. |
| robots.txt | `app/robots.ts` disallowing `/admin/**`, `/api/**`, `/profile/**` from indexing. |
| Hero section improvement | Logged-out hero is three lines of text + two buttons. Add 3-column social proof row (N skills · N users · N neighborhoods) below the CTAs. Stats already fetched. |
| Max-width to 7xl | Change `max-w-5xl` to `max-w-7xl` in `layout.tsx`. Single character. Breathing room on large monitors. |
| Dashboard section visual separation | "Browse" and "My Activity" icon grids are visually identical. Add subtle background difference or labeled divider. |
| Community guidelines page | Static `/guidelines` page defining acceptable use. Required for defensible moderation decisions. Link from footer and listing creation forms. |
| Referral / invite system | "Invite your neighbor" — unique link per user, `referrals` table, points awarded on successful registration. Highest-ROI growth mechanic for community apps. |
| Municipality partnership page | Static `/for-municipalities` landing page. Required before any government outreach. |
| Streak / re-engagement mechanics | "You haven't shared in 3 weeks" notification or streak counter for dormant users. |
| `community_hero` badge threshold reduction | Requires 10 completed requests — too high for a new platform. Reduce to 3. First milestone should be reachable within 2–3 interactions. |
| Web badges grid on profile | Show earned badges on own profile page. `checkAndAwardBadges` exists and runs — web UI not yet wired. |
| Mobile: Ratings flow | `RatingModal` component + trigger from completed request/reservation cards + public profile reviews section. Same data as web, mobile-specific flow. |
| i18n remaining web pages | Auth pages (login, register, forgot-password, reset-password, verify-email) and all module pages (skills, tools, events, drives, food, profile, notifications, leaderboard). next-intl infrastructure is done — just needs `useTranslations()` wired per page. Translation keys already exist in `en.json` / `bg.json`. |
| Mobile i18n full implementation | Replace `packages/mobile/lib/i18n.ts` stub with `i18next` + `expo-localization`. EN/BG message files. Read locale from `Localization.locale`. |
| DB indexes on date-filtered columns | `food_shares.available_until`, `events.starts_at`, `community_drives.deadline` — new Drizzle migration, pure performance. |
| `updatedAt` on junction tables | `event_attendees` and `drive_pledges` missing `updatedAt`. Add via migration for future audit/analytics. |
| Notification table cleanup | No cleanup mechanism — grows unbounded. Add soft-delete + 90-day archive/purge job. |
| Email notifications for key events | Resend is integrated but no transactional emails exist for: reservation accepted/rejected, skill request accepted, food pickup confirmed. Push is done; email is not. |
| Mobile: Create + Edit Tool screens | `tools/new.tsx` and `tools/edit/[id].tsx` do not exist. Mobile users can browse and reserve tools but cannot list their own. |
| Mobile: Edit Event + Edit Drive screens | `events/edit/[id].tsx` and `drives/edit/[id].tsx` do not exist on mobile. |
| Mobile: Achievements / Badges screen | `profile/achievements.tsx` does not exist. Badges and user stats are invisible to mobile users. |
| Mobile: Map pin → detail navigation | `radar.tsx` shows location density but tapping a pin does not navigate to the listing. Wire tap to detail page. |
| Mobile leaderboard screen | Web leaderboard exists; mobile has no equivalent. |
| Mobile map: wire live API | Mobile map tab uses static/demo markers. Wire to live `GET /api/map`. |
| Data breach incident response plan | Document KZLD 72-hour notification procedure (GDPR Art. 33). Private ops runbook. |
| `pg_trgm` GIN search indexes | Trigram indexes on `title` columns for skills, tools, events, food_shares. Drizzle migration. Cuts search latency 10x at 100k+ rows. |
| Cache-Control on public list endpoints | Add `Cache-Control: public, max-age=30, stale-while-revalidate=60` to `/api/skills`, `/api/tools`, `/api/events`, `/api/food-shares`. |
| Orphan cleanup job | Weekly cleanup of orphaned rows in `ratings`, `notifications`, `feed_events` where referenced entity no longer exists. |
| Profile rating stats recalculation | `profiles.avgRating` + `profiles.ratingCount` can drift if a rating write fails. Add scheduled recalculation endpoint or Postgres trigger. |
| FK validation helper | Extract repeated category/location existence checks into `validateForeignKey()` in `lib/db-helpers.ts`. Removes ~50 duplicate lines. |
| Status string constants | Extract all status string literals (`'available'`, `'pending'`, `'pledged'`, etc.) to `lib/constants/statuses.ts`. Typos fail silently — no type error, wrong comparison. |
| `queryFoodReservationsForUser` pagination | Hardcoded `.limit(50)` — users with 50+ food reservations get a silently truncated list. Add `limit` + `offset` params. |
| Food module UX polish | Add `showToast(...)` after successful mutations in `new-food-form.tsx` and `reservation-section.tsx`. Add `ConfirmDialog` for approve/reject/picked_up/cancel actions. |
| Analytics event tracking | Wire PostHog to key events: `skill_request_created`, `tool_reserved`, `food_share_created`, `drive_pledged`. No PII in event properties. `posthog-js` already in `package.json`. |
| Make / Remove Admin in Admin Panel | Verify promote/demote admin buttons exist in `/admin/users`. Add if missing. |
| Personal activity stats on profile | "N swaps, N hours helped, N food shares" on public profile. Derived from existing data. |
| Image upload — remaining forms | `<ImageUpload>` component exists but not wired to: `tools/new`, `tools/[id]/edit`, `events/new`, `drives/new`. Pattern exists — add import + field. |

---

### P4 – Design & UX Polish

| Item | Description |
|------|-------------|
| Brand typography | No custom font — system font renders differently per device. Add `Inter` or `Plus Jakarta Sans` via `next/font/google`. One import, immediate brand elevation. |
| CTA color differentiation | `green-700` used for nav hovers AND primary CTA buttons — no visual hierarchy. Change CTA buttons to `emerald-600`; introduce `amber-600` for secondary-action affordances. |
| Accessibility pass (WCAG 2.1 AA) | Systematic `aria-label`, `aria-expanded`, focus management audit. EN 301 549 EU standard applies in Bulgaria. |
| App Store submission materials | Screenshots EN + BG, descriptions, content rating forms, Google Play Data Safety form. Hard blocker for store submission. |
| Calendar export | `.ics` / Google Calendar deep-link on event detail and confirmed reservations. Standard UX expectation. |
| Help center / FAQ page | Static `/help` answering most common new-user questions. No contact link + no FAQ = dead end for any real issue. |
| AI chat content guardrails | Add "neighborhood discovery only" topic restriction to system prompt + explicit "not professional advice" disclaimer. Reduces EU AI Act high-risk classification risk. |
| Mobile build verification in CI | Add EAS build dry-run or `expo export` step to CI. Currently only typecheck runs — bundling errors not caught. |
| SSE → polling | `/api/notifications/stream` (SSE) creates long-lived connection incompatible with Netlify's 10s serverless timeout. Replace with `GET /api/notifications?after=<ts>` polling. |
| JWT key rotation procedure | Document: bump token version counter in DB → force logout all sessions → rotate `JWT_SECRET` env var. |
| Audit log append-only sink | Critical audit events written to a table a compromised admin could delete. Add separate table with `REVOKE DELETE` or external structured log sink. |
| Event waitlist | `event_waitlist` table with ordered position + auto-promotion when an attendee cancels. `maxCapacity` currently hard-rejects over-capacity RSVPs. |
| Drive numeric goals | Add `goalAmount: integer` + `currentAmount: integer` to `community_drives` so drives can show "57 of 100 items collected." Currently `goalDescription` is text-only. |
| Tool return date enforcement | Add `returnBy` column to `tool_reservations` + overdue notification. Loans currently go stale indefinitely. |
| Skill endorsements | `skill_endorsements` table — neighbors who completed exchanges can vouch for skills. Solves cold-start trust problem. |
| User home neighborhood | Add `defaultLocationId` FK to `profiles` for "near you" pre-filter in discovery. |
| `conversations` DB CHECK constraint | Add `CHECK(participant_a < participant_b)` — defense-in-depth. App layer via `normalizePair()` already handles this. |
| `SameSite=Strict` on refresh cookie | Minor hardening only — `SameSite=Lax` already blocks CSRF. `Strict` also blocks navigation-link cross-origin sends. |
| Mobile load-more race guard | Add `isLoadingMore` guard flag in `food/index.tsx` + `tools/index.tsx` — tapping "load more" twice triggers duplicate fetches. |
| Remove dead `isFetchingRef` | `food/index.tsx:57` — a `useRef` created but never read. Remove dead code. |
| Pagination variable standardization | Feed uses `{ limit, offset }`, all other routes use `{ page, limit }`. Standardize on one approach. |
| Hardcoded pagination defaults → constant | Each query file declares `limit = 20`, `page = 1` independently. Extract to `lib/query-defaults.ts`. |
| Select objects DRY in query files | `skillSelect`, `toolSelect` etc. partially re-spread in per-function selects. Use the constant everywhere. |
| Default profile name constant | `'Neighbor'` hardcoded in multiple files. Extract to `lib/constants.ts`. |

---

### P5 – Future / Deferred

| Item | Description |
|------|-------------|
| Mutation testing (Stryker) | Run Stryker on `lib/state-machine.ts` + `lib/badges.ts` to verify tests actually catch regressions. |
| SAST — Semgrep / CodeQL | Static analysis for SQL injection, XSS, JWT bypass. GitHub Actions job. |
| Pen tester engagement | Active pentest: JWT algo confusion, mass assignment, SSRF via imageUrl, R2 enumeration. Code review is not a substitute. |
| Gamification redesign | Variable points by complexity, streak mechanics, neighborhood contribution score. Calibrate on real user data. |
| Flat point system redesign | All exchanges award equal points regardless of complexity. Redesign when data is available. |
| Referral incentive fine-tuning | A/B test incentive sizes + messaging after referral system (P3) ships. |
| Enterprise / business accounts | Analytics dashboard, API access, sponsored listings, white-label. Long-term revenue track. |
| TanStack Query Wave F | Full query migration for food, tools, events on web. Low urgency — all modules stable. |
| Landing page visual rebrand | Hero illustration, testimonials, product screenshots. Post-launch with real users. |
| Shared `packages/shared` types | Shared package for `MapMarker`, `FoodShare`, `ToolReservation` between web and mobile. Eliminates drift. |
| Hourly time slots for tool reservations | Date + time slot (10:00–12:00) for tool handoff coordination. Requires schema change. |
| Multiple images per listing | `attachments` table for multiple images per skill/tool/food/event listing. |

---

## Technical Backlog

> Engineering-focused items — architecture, refactor, and backend correctness. Use this when choosing the next technical task without scanning the full product backlog.

### P2

| Item | Domain | Description |
|------|--------|-------------|
| `requireVerifiedAuth` rollout | Backend | `requireVerifiedAuth()` wrapper exists in `lib/middleware.ts` but the inline email verification check (`!dbUser?.emailVerifiedAt → UNVERIFIED_EMAIL`) is still copy-pasted in 8+ create routes. Migrate all create routes to use the wrapper. |
| `requireAuthWithRateLimit` middleware | Backend | Rate-limit boilerplate (`apiRatelimit.limit(user.sub) → 429`) duplicated in 40+ routes. Extract into a reusable middleware wrapper. |
| Feed event: HTTP fetch → direct call | Backend | 5 create routes call `fetch('/api/feed', ...)` internally — unnecessary HTTP round-trip, fire-and-forget swallows failures. Replace with direct function invocation. |
| Extract shared `isUniqueViolation` | Backend | Identical helper duplicated in `tool-reservations/route.ts` and `food-shares/[id]/reservations/route.ts`. Extract to `lib/db-errors.ts`. |

### P3

| Item | Domain | Description |
|------|--------|-------------|
| Integration tests — Neon test branch | QA | Create `TEST_DATABASE_URL` pointing to a dedicated Neon branch → migrate → TRUNCATE before each suite → seed deterministic data → call route handlers via Vitest. Priority targets: register, POST /api/skills, PATCH /api/skill-requests/[id] state machine. |
| Unit tests — `lib/format.ts` | QA | 12 pure functions (`formatDateTime`, `formatDate`, `formatEventStatus`, etc.) — zero DB/network, perfect unit test targets. Edge cases: null, undefined, unknown enum values. |
| Unit tests — Zod schemas | QA | 11 schema files containing business logic (min/max, enums, URL format). Test: valid payloads pass, invalid fail with correct `.issues`, boundary values. |
| Unit tests — `lib/badges.ts` | QA | `checkAndAwardBadges` — test each badge at correct threshold, not below, idempotent on repeat call. |
| Coverage threshold in CI | QA | Add `--coverage.thresholds.lines=70` for `src/lib/` to `npm run test:web`. Prevents silent coverage regression. |
| Contract tests expansion | QA | Skills + skill-requests have contract tests. Add for: tools, food, events, drives, auth. |
| E2E — full skill exchange cycle | QA | Playwright: create skill → request → accept → complete → rate. Full happy path across 5 API calls. |
| E2E — tool + food cycles | QA | Tool: create → reserve → approve → return. Food: create → reserve → mark picked_up. |
| Accessibility tests (axe-core) | QA | `@axe-core/playwright` scan on home, skills, login, register, chat. Fail CI on WCAG 2.1 AA critical violations. |
| Negative / error path smoke tests | QA | 401 on unauth requests, 403 on wrong-user mutations, 409 on duplicate reservation, 422 on invalid state transitions — all modules. |
| Rate-limit smoke test | QA | Fire N+1 rapid requests → assert 429. Verifies Upstash wiring in production. |

### P4

| Item | Domain | Description |
|------|--------|-------------|
| Visual regression tests | QA | Playwright `page.screenshot()` baselines for home, skills list, food list. Compare on each PR. |
| Performance baseline (k6) | QA / SRE | k6 script targeting main list endpoints — establish p95 latency at 50 VU before/after DB index changes. |
| Mobile unit tests | QA | Vitest/Jest for `packages/mobile/lib/` — state hooks, formatting utils. Zero test coverage on mobile package. |

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
