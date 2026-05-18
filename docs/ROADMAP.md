# Neighborhood Hub – Roadmap

> Last updated: 2026-05-18 (milestone review #3: 3 new bugs fixed — AI chat history fetched oldest-first, GET /api/profile N+1 query, soft-deleted users visible in feed)

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
| `POST /api/ai/chat` missing outer try/catch | Bug | Easy | Low | S | ✅ | ✅ Fixed 2026-05-18 — Entire handler body had no try/catch. Any DB error outside the inner Anthropic try/catch produced an HTML 500 instead of JSON `{ error }`. Wrapped full handler body in try/catch. |
| `requireAdmin` bypasses account lock | Security | Easy | High | S | — | ✅ Fixed 2026-05-18 — `requireAdmin` chained into `requireAuth` (JWT-only) without checking `lockedUntil`. A banned admin could use all admin routes indefinitely. Added DB lookup for `lockedUntil` in `requireAdmin`. |
| `events/[id]` DELETE missing `updatedAt` | Bug | Easy | Low | S | ✅ | ✅ Fixed 2026-05-18 — Soft-delete on events set `deletedAt` but not `updatedAt`. Cache invalidation and audit trails were unreliable for deleted events. |
| `admin/reports` unpublish missing `updatedAt` | Bug | Easy | Low | S | ✅ | ✅ Fixed 2026-05-18 — Admin unpublish of tools, food, events, and drives did not set `updatedAt: now`. All four cases now updated consistently. |
| `syncFoodShareStatus` logic bug | Bug | Easy | Med | S | ✅ | ✅ Fixed 2026-05-18 — When `pickedUpCount + activeCount >= quantity` but neither alone reached the threshold (e.g. quantity=2, pickedUp=1, active=1), status was incorrectly set to `available`. Fixed condition order: check `pickedUpCount >= quantity` first, then `(activeCount + pickedUpCount) >= quantity` for `reserved`. |
| Skill request concurrent `complete` → double points | Bug | Easy | High | S | — | ✅ Fixed 2026-05-18 — Two concurrent `complete` calls could both read `status=accepted`, both pass the state check, and both award `SKILL_COMPLETE_POINTS` to both parties (double points). Added CAS WHERE guard: UPDATE only if `status = 'accepted'`. Returns 422 if 0 rows updated (concurrent winner already completed). |
| `first_drive` badge never awarded | Bug | Easy | Low | S | ✅ | ✅ Fixed 2026-05-18 — `POST /api/drives/[id]/pledges` never called `checkAndAwardBadges`. The `first_drive` badge had no trigger path. Added fire-and-forget call after pledge creation. |
| `five_star_giver` badge never awarded | Bug | Easy | Low | S | ✅ | ✅ Fixed 2026-05-18 — `POST /api/ratings` never called `checkAndAwardBadges`. The `five_star_giver` badge had no trigger path. Added fire-and-forget call after rating insert. |
| AI chat history fetches oldest-first instead of newest | Bug | Easy | Med | S | ✅ | ✅ Fixed 2026-05-18 — `orderBy(asc).limit(20)` returned the first 20 messages ever sent. After message 21, the AI lost all recent context. Fixed: `orderBy(desc).limit(20)` then `.reverse()` to restore chronological order. |
| `GET /api/profile` N+1 sequential location query | Bug | Easy | Low | S | ✅ | ✅ Fixed 2026-05-18 — Location was fetched in a third sequential DB round-trip after user+profile. Collapsed into a single `Promise.all` with a LEFT JOIN on locations in the profile query. |
| Soft-deleted users still appear in public feed | Security | Easy | Low | S | ✅ | ✅ Fixed 2026-05-18 — `GET /api/feed` joined profiles (isPublic=true) but not users. Soft-deleted users' feed events remained visible. Added `INNER JOIN users WHERE deletedAt IS NULL` to both the items query and the count query. |
| `admin/reports` skill unpublish missing `updatedAt` | Bug | Easy | Low | S | ✅ | ✅ Fixed 2026-05-18 — `case 'skill'` in unpublish switch set `status: 'retired'` and `deletedAt: now` but not `updatedAt: now`. All other cases (tool, food, event, drive) already set `updatedAt`. Cache invalidation and audit trails were unreliable for admin-unpublished skills. |
| Mobile `auth.tsx` `register()` hardcodes `ageConfirmed: true` | Bug | Easy | Low | S | ✅ | ✅ Fixed 2026-05-18 — `register(name, email, password)` always sent `ageConfirmed: true` regardless of actual user consent. UI checkbox prevented submit in normal flow but any programmatic call bypassed age verification. Added `ageConfirmed: boolean` as 4th parameter; call site in `register.tsx` passes actual state. |
| `GET /api/profile` missing try/catch | Bug | Easy | Low | S | ✅ | ✅ Fixed 2026-05-17 — DB errors in the GET handler propagated through `requireAuth`'s catch block, returning a 401 INVALID_TOKEN instead of 500. Wrapped handler body in try/catch. |
| `POST /api/ratings` missing audit log | Bug | Easy | Low | S | ✅ | ✅ Fixed 2026-05-17 — Rating submissions affect `profiles.avgRating` but were not written to `audit_log`. Added `writeAuditLog` call after profile update, consistent with all other write endpoints. |
| Token refresh bypasses account lock | Security | Easy | High | S | — | ✅ Fixed 2026-05-17 — `POST /api/auth/refresh` now checks `user.lockedUntil > now()` before issuing a new access token. Previously a banned user could re-auth indefinitely via refresh token rotation. |
| Expire-stale skill requests use wrong status | Bug | Easy | Low | S | ✅ | ✅ Fixed 2026-05-17 — `expire-stale` route now sets `status: 'cancelled'` not `'rejected'` for timed-out skill requests. `rejected` = active owner decline; timeout = cancellation. |
| Cancelled event can be re-published | Bug | Easy | Med | S | ✅ | ✅ Fixed 2026-05-17 — `PATCH /api/events/[id]` now returns 422 EVENT_ALREADY_CANCELLED if the event is already cancelled. Previously organizers could PATCH status back to 'published' after cancellation. |
| Event notification loop blocks response | Bug | Easy | Low | S | ✅ | ✅ Fixed 2026-05-17 — `await createNotification(...)` inside attendee loop changed to `void ... .catch(...)` in both PATCH (cancel) and DELETE handlers. 100-attendee event would have blocked serverless response for seconds. |
| Drive pledge creation missing audit log | Bug | Easy | Low | S | ✅ | ✅ Fixed 2026-05-17 — `POST /api/drives/[id]/pledges` now calls `writeAuditLog` after pledge insertion. All other content creation routes log to audit; this was the only omission. |
| Drive pledge state transition missing updatedAt | Bug | Easy | Low | S | ✅ | ✅ Fixed 2026-05-17 — `PATCH /api/drives/[id]/pledges/[pledgeId]` now includes `updatedAt: new Date()` in the update. Also fixed re-pledge update in POST handler. |
| DB schema drift: defaultLocationId | Bug | Easy | Low | S | ✅ | ✅ Done — Migration 0026 ran against production 2026-05-17. `profiles.defaultLocationId` column now live. |
| Feed privacy GDPR fix | Security | Medium | High | M | — | ✅ Done — `GET /api/feed` now inner-joins `profiles` and filters `isPublic = true`. Private profile events no longer visible. Fixed 2026-05-17. |
| Cookie consent actually blocks PostHog | Legal | Medium | High | M | — | ✅ Done — PostHog provider uses `opt_out_capturing_by_default: true`. No data sent until user explicitly calls `opt_in_capturing()` via consent banner. |
| File upload MIME type validation | Security | Medium | High | M | — | ✅ Done — MIME allowlist + magic byte validation for JPEG/PNG/WebP + 5 MB cap implemented in `/api/upload/route.ts`. |
| Age verification checkbox | Legal | Easy | Low | S | ✅ | ✅ Done — `ageConfirmed: z.literal(true)` added to `POST /api/auth/register` schema. UI checkbox also enforces it. Mobile needs to send the field. |
| Privacy Policy URL for App Store | Legal | Easy | Low | S | ✅ | ✅ Done — `/privacy` page exists and is publicly accessible at `https://neighborhoodhub.bg/privacy`. Use this URL in App Store / Google Play submission forms. |
| Uptime monitoring | Infra | Easy | Low | S | ✅ | ✅ Done (endpoint) — `GET /api/health` returns `{ status, db, ts }` with DB connectivity check. Remaining: register URL on UptimeRobot / Betterstack free tier (5-minute manual setup, external service). |

---

### P2 – High Value (next sprint)

| Item | Type | Difficulty | Risk | Effort | Copilot | Description |
|------|------|-----------|------|--------|---------|-------------|
| CI/CD pipeline (GitHub Actions) | Infra | Medium | Low | L | ✅ | ✅ Done — `.github/workflows/ci-smoke.yml` runs typecheck + unit + integration + Playwright. Netlify auto-deploys from master via GitHub integration. |
| Cross-module search UX | UX/Feature | Medium | Low | M | — | ✅ Done (backend) — `GET /api/search` now returns `unified` array (all types merged, sorted by ts_rank DESC) alongside per-type arrays. `totalByType.total` added. Frontend search UI still shows per-tab view — needs "All" tab wired to `unified` array (P3 polish). |
| Tool date-overlap enforcement | Bug | Easy | High | S | ✅ | ✅ Done — `POST /api/tool-reservations` now queries for any `pending`/`approved` reservation with overlapping dates before insert. Returns `409 DATE_CONFLICT`. Remaining gap: TOCTOU race possible for concurrent requests (no transaction support on neon-http). |
| Data retention automation | Legal/Infra | Medium | Med | L | — | ✅ Done (endpoint) — `POST /api/admin/data-retention` deletes AI messages >12 months and audit log entries >24 months. `POST /api/admin/purge-deleted-users` handles 30-day user purge. Missing: all 3 endpoints need nightly scheduling via n8n or Netlify scheduled function. |
| Push notifications (mobile) | Feature | Hard | Med | XL | — | ✅ Done — `sendPushNotification()` in `lib/push.ts` calls Expo Push API directly (no SDK needed). Called from `createNotification()` for all 24 notification types. DB silent catch bug fixed 2026-05-17. Mobile token registration via `expo-notifications` wired in auth flow. |
| DM spam from unverified accounts | Security/UX | Easy | Low | S | ✅ | ✅ Done — `POST /api/conversations` and `POST /api/conversations/[id]/messages` now use `requireVerifiedAuthWithRateLimit`. Unverified accounts can still read (GET) but cannot send new messages. |
| AI chat: orphaned user message on retry | Bug | Easy | Med | S | ✅ | ✅ Done — If Anthropic returns AI_UNAVAILABLE, a compensating `db.delete` removes the persisted user message so retry starts with clean conversation history and no duplicate context. |
| Gamification balance | Feature | Medium | Low | L | — | ✅ Done — +5 pts on tool returned (borrower), +3 pts on food picked_up (owner), +1 pt on event RSVP (new only, not re-RSVP). 4 new badges added: `first_event`, `first_drive`, `good_neighbor` (5 food shares), `tool_master` (3 returned tool loans). Migration 0029 applied 2026-05-17. |
| Admin: report → content action | Feature | Medium | Med | L | — | ✅ Done — `PATCH /api/admin/reports` with `action: 'unpublish'` removes content per targetType: skill→retired+deleted, tool/food→deletedAt, event/drive→cancelled, user→lockedUntil 2099, message→body '[removed by admin]'. Frontend shows red "Unpublish" button with confirmation dialog + clickable link to view content before acting. |
| Infrastructure cost model | Docs | Easy | Low | M | ✅ | ✅ Done — `docs/INFRASTRUCTURE-COSTS.md` documents free tier limits and projected costs at 1k/10k/100k MAU for all 6 services. Summary: ~$2/mo at 1k, ~$99/mo at 10k, includes cost risk factors. |

---

### P3 – Planned

| Item | Type | Difficulty | Risk | Effort | Copilot | Description |
|------|------|-----------|------|--------|---------|-------------|
| Event cancellation notification | Bug/Feature | Easy | Low | S | ✅ | ✅ Done — Both PATCH (cancel) and DELETE on `events/[id]/route.ts` query all `eventAttendees` with status 'attending' and call `createNotification({ type: 'event_cancelled' })` for each. Push notification also fires via `sendPushNotification`. |
| Drive pledge: volunteer time type | Feature | Easy | Low | S | ✅ | `drive_type` enum is `items/money/food/other`. "Volunteer time" is a major NGO category not represented. Add `volunteer` to the enum (requires migration). |
| Mobile: endorsements UI | Feature | Easy | Low | S | ✅ | ✅ Done — `packages/mobile/app/(app)/skills/[id].tsx` has endorsement count display, endorse/un-endorse toggle with optimistic update, hidden for own skills. |
| Admin: user search + filter | Feature | Easy | Low | M | ✅ | Admin `/admin/users` has no search field — finding a specific user requires paginating through all results. Add server-side search by email/name and filter by role/status. |
| Mobile: Achievements / Badges screen | Feature | Easy | Low | M | ✅ | ✅ Done 2026-05-18 — `packages/mobile/app/(app)/profile/achievements.tsx` built with StatsCard (points/level/rank/progress bar), earned BadgeCard list, LockedBadgeCard list. Button in profile tab. `GET /api/me/stats` extended to return badges array. |
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
| Mobile map: wire live API | Feature | Medium | Med | M | — | ✅ Done — Radar screen now fetches `GET /api/map` and renders individual color-coded pins (green=skill, blue=tool, orange=food, purple=event) alongside neighborhood density circles. Remaining: `pinColor` tinting does not apply on Android (iOS only). Performance untested at 2000+ markers. |
| Mobile i18n full implementation | Feature | Medium | Low | L | ✅ | Replace `packages/mobile/lib/i18n.ts` stub with `i18next` + `expo-localization`. EN/BG message files. Read locale from `Localization.locale`. |
| New user onboarding flow | UX | Medium | Low | L | ✅ | After registration + email verify, new user lands on an empty page. Add guided first-use: "Complete your profile", "Browse skills near you", "Post your first skill" with illustrations + CTAs on all empty list pages. Users who don't post within 48h churn at 3-5x (Nextdoor internal data). |
| `users.lastActiveAt` signal | UX/Schema | Easy | Low | S | ✅ | No recency signal on profiles or listings. Users can't tell if a skill/tool offer is from an active neighbor or a dormant account — main reason they won't initiate contact. Add `lastActiveAt` column updated on token refresh, display "Active X days ago" on profile + listing cards. |
| `drive_pledges.amount` schema fix | Schema/Bug | Easy | Low | S | ✅ | `community_drives.currentAmount` is manually maintained with no source of truth in pledges. Progress bar is untrustworthy for real charity drives. Add `amount integer nullable` to `drive_pledges`, compute `currentAmount` via aggregate on read. |
| Community health stats on homepage | UX/Feature | Easy | Low | S | ✅ | Landing page has no activity signal. One aggregate query (total skills + tools + food + events in user's city) displayed in the hero converts skeptics into signups by demonstrating platform vitality. |
| Organizer dashboard | Feature | Medium | Low | L | — | Event and drive organizers have no way to see attendance stats, pledge counts, or engagement for their own content. Add a "My Events" / "My Drives" stats view visible to organizers. |
| Pending request auto-expire | Feature/Infra | Medium | Med | L | — | ✅ Done — `POST /api/admin/expire-stale` bulk-rejects skill requests >30d, cancels tool reservations >14d, cancels food reservations >7d. Missing: no in-app notification or email sent to affected users on expiry. |
| Weekly digest email | Feature | Medium | Low | L | — | Resend is integrated but sends only transactional emails. Add a weekly Sunday digest: "This week in your neighborhood" — new skills nearby, upcoming events, top contributor. Proven D30 retention mechanic for community apps. |
| Mobile: deep links | Infra | Medium | Low | L | — | Email links (reservation approved, skill request accepted) open the web app even when the native app is installed. Implement Universal Links / App Links via Expo so email CTAs route to the native app. |
| "Near me" search | Feature | Hard | Med | XL | — | `GET /api/search` filters by `locationId` (dropdown) but not by distance. Add `lat/lng/radius` params and PostgreSQL `earthdistance` haversine filter. Neon has the extension built-in. Core feature for a neighborhood-based platform. |
| Search: Bulgarian text with English stemmer | Bug/UX | Easy | Low | S | — | ✅ Done — All search modules now use `plainto_tsquery('simple', q)`. Skills, tools, events, food all consistent. |
| AI chat accessible to unverified accounts | Security | Easy | Low | S | — | ✅ Done — `POST /api/ai/chat` now uses `requireVerifiedAuth`. Unverified accounts cannot consume AI quota. |
| Conversation list leaks blocked-user relationships | Privacy | Easy | Low | S | — | ✅ Done — `GET /api/conversations` now queries `userBlocks` for all other participants and filters blocked-user conversations from the response. |
| Tool date-overlap: TOCTOU fix | Bug/Security | Hard | Med | L | — | ✅ Done — `POST /api/tool-reservations` now uses atomic `INSERT ... SELECT ... WHERE NOT EXISTS (overlap)` via `db.execute(sql\`...\`)`. No schema change required. Concurrent requests for same tool+dates now guaranteed to have only one succeed. |
| Expiry notifications for auto-expired requests | UX/Feature | Easy | Low | M | — | ✅ Done — `POST /api/admin/expire-stale` fires `createNotification` for every expired row: `request_cancelled` (not `request_rejected`) for skill requests, `reservation_cancelled` for tools (borrower + owner), `food_reservation_cancelled` for food. |

---

### P4 – Design & UX Polish

| Item | Type | Difficulty | Risk | Effort | Copilot | Description |
|------|------|-----------|------|--------|---------|-------------|
| Mobile map: Android pin colors | Bug/UX | Easy | Low | S | — | `react-native-maps` `pinColor` prop only tints default pins on iOS. On Android, pins render in default red regardless of hex value. Fix: replace `pinColor` prop with a custom `<View>` child marker (colored circle) inside `<Marker>`. |
| Mobile map: marker clustering | Performance | Hard | Low | XL | — | `/api/map` returns up to 2000 markers (500 per type × 4). No clustering — all render at once. On low-end Android devices this causes visible frame drops. Add `?bbox=&zoom=` params to API: at low zoom return neighborhood aggregates, at high zoom return individual markers within bbox. |
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
| `state-machine.ts` orphaned utility | Refactor | Refactor | Medium | Low | M | — | ✅ Done 2026-05-17 — Deleted `state-machine.ts` and `state-machine.test.ts`. All 3 state machine routes use inline validation; centralizing added complexity without benefit. TypeScript: 0 errors after deletion. |
| `profiles.avgRating` auto-sync | Schema | Bug | Medium | Med | M | — | `profiles.avgRating` and `ratingCount` can drift from the `ratings` table if a rating is edited or deleted. `POST /api/admin/recalc-ratings` exists but is manual-only. Add automatic trigger or call recalc on rating insert/update/delete. |
| E2E — full skill exchange cycle | QA | QA | Medium | Low | M | — | Playwright: create skill → request → accept → complete → rate. Full happy path across 5 API calls. [Unblocked once DB schema drift migration runs — P1]. |
| Negative / error path smoke tests | QA | QA | Medium | Low | L | — | 401 on unauth requests, 403 on wrong-user mutations, 409 on duplicate reservation, 422 on invalid state transitions — all modules. |
| Missing email notifications | Backend | Feature | Medium | Low | L | — | No email sent for: tool reservation approved/rejected, event RSVP confirmed, drive pledge accepted/fulfilled. Users rely on in-app notifications only for these transitions — email adds reliability and re-engagement. |
| Unbounded temporal table archival | DB | Infra | Medium | Med | L | — | `audit_log`, `feed_events`, `messages` grow indefinitely. At 1 000 active users × 10 actions/day → 3.6M audit rows/year. Define retention window and add nightly archival/deletion job. |
| **next.config.ts regression** | Infra | Security | Easy | Low | S | ✅ | ✅ Fixed in milestone review 2026-05-15 — restored turbopack alias (i18n), Sentry wrapper, outputFileTracingRoot (Netlify), and connect-src PostHog/Sentry URLs that were accidentally stripped in refactor(ui) commit. |
| Profile page missing badges + time credits | Bug/UX | Medium | Low | M | — | Profile page converted to client component lost `TimeCreditCard` and `AchievementBadges` which required server-side DB data. `DangerZone` and `PointsBadge` were restored in milestone review. Restore time credits and badges by adding client-side data fetching or a dedicated `/api/me/profile-stats` endpoint. |
| Tool reservation TOCTOU | Backend | Security | Hard | High | L | — | `POST /api/tool-reservations` checks `tool.status='available'` then inserts without atomic guard. Two concurrent requests can both pass the check before either commits. Add `SELECT ... FOR UPDATE` atomic SQL guard. |
| Food quantity race condition | Backend | Security | Medium | High | M | — | ✅ Fixed 2026-05-16 — `PATCH /api/food-shares/[id]/reservations/[reservationId]` (approve action) uses an atomic WHERE-clause subquery so two concurrent approvals cannot both succeed. A post-commit compensating rollback handles READ COMMITTED phantom reads. |
| Tool date-overlap not enforced | Backend | Bug | Medium | Med | M | — | `tool_reservations_active_idx` prevents the same borrower from double-booking but does NOT prevent two different borrowers reserving the same tool for overlapping dates. Add an exclusion constraint or application-level overlap check on reservation creation. |
| `content_reports` orphan table | DB | Cleanup | Easy | Low | S | — | Production DB has `content_reports` table that is not defined in schema.ts or any migration. Likely a renamed predecessor of `reports` (migration 0015). Audit for any references, then drop it. |
| Admin destructive rate limit tightening | Security | Refactor | Easy | Low | S | — | `cleanup-orphans` and `purge-deleted-users` share the same `apiRatelimit` (100 req/min) as all other routes. Bulk-delete operations should have a stricter dedicated limiter (e.g. 10 req/min). Add `adminDestructiveRatelimit` in `lib/ratelimit.ts` and apply to those two routes. |
| Orphan cleanup pagination | Backend | Scale | Medium | Low | M | — | `POST /api/admin/cleanup-orphans` deletes all orphaned notifications in one query per entity type. At 10k+ orphaned rows this risks a Neon HTTP timeout. Add batch-by-1000 loop with a continuation token and return `{ deleted, remaining }`. |
| `GET /api/conversations` exposes blocked users | Backend | Privacy | Easy | Low | S | ✅ | ✅ Done 2026-05-17 — Bidirectional `userBlocks` query on all conversation partner IDs; blocked conversations filtered before profile/message queries. |
| `skill_endorsements` CHECK constraint drift | Schema | Bug | Easy | Low | S | — | Table was created manually during schema-drift repair with an extra `skill_endorsements_skill_endorser_self_check` constraint not present in migration 0027 or schema.ts. Either add the check to schema.ts + generate a migration, or drop the constraint to eliminate drift. |
| Admin demote last-admin race condition | Security | Medium | High | M | — | Two admins simultaneously demoting each other both read `adminCount=2`, both pass the `<= 1` guard, and both succeed. Zero admins remain — no recovery path. Fix: atomic conditional UPDATE `SET role='user' WHERE id=$id AND (SELECT COUNT(*) FROM users WHERE role='admin') > 1`, check 0 rows = last admin error. |
| Admin soft-delete doesn't cascade to active reservations | Backend | Medium | Med | M | — | Setting `users.deletedAt` does NOT cascade to active `skill_requests`, `tool_reservations`, or `food_reservations` — `ON DELETE CASCADE` only fires on hard DB DELETE. Active reservations remain actionable by the other party. Define product policy: cancel active reservations on soft-delete, or allow them to complete naturally. |
| Admin unpublish doesn't notify event attendees / drive pledgers | UX | Easy | Low | S | ✅ | ✅ Fixed 2026-05-18 — Admin unpublish of `event` now queries `eventAttendees WHERE status='attending'` and fires `event_cancelled` notification for each. `drive` unpublish queries `drivePledges WHERE status='pledged'` and fires `drive_cancelled` for each pledger. |
| Concurrent tool reservation approval → double notification | Bug | Easy | Low | S | — | ✅ Fixed 2026-05-18 — Added CAS guard `AND status = 'pending'` to the UPDATE WHERE clause in `PATCH /api/tool-reservations/[id]` for the `approve` action. Returns 422 INVALID_TRANSITION if 0 rows updated (concurrent winner already approved). |
| Admin destructive routes missing rate limit | Security | Easy | Low | S | ✅ | `POST /api/admin/cleanup-orphans` and `POST /api/admin/purge-deleted-users` use `requireAdmin` but apply no rate limit. A compromised admin token could trigger unbounded DB deletes. Add `apiRatelimit.limit(user.sub)` guard matching the pattern in other admin routes. |
| `GET /api/ratings` fully public | Security | Easy | Low | S | ✅ | `GET /api/ratings` requires no auth — full rating corpus scraped anonymously with just userId param. Has `searchPublicRatelimit` (30 req/min per IP) so scraping is slowed but not blocked. Consider requiring auth for this endpoint since ratings contain commenter identities. |
| `messages.senderId` missing index | Performance | Schema | Easy | Low | S | ✅ | Already listed under Missing DB indexes (P3) — confirm `messages_unread_idx` covers `senderId` lookup; if not, add explicit index. |
| `datetimepicker.js` shim untyped | Refactor | Bug | Easy | Low | S | ✅ | `packages/mobile/web-shims/datetimepicker.js` is plain JS with no prop types. `onChange` fires `({}, date)` — diverges from native picker which passes `(event, date)`. Convert to `.tsx` with explicit prop interface to prevent silent mismatch on web builds. |
| `cancel` on APPROVED tool reservation allows borrower only | QA | Bug | Easy | Low | S | ✅ | PATCH `/api/tool-reservations/[id]` — when `action=cancel` and `status=approved`, only the borrower is blocked at PENDING, but for APPROVED status both owner and borrower can cancel. Confirm this is intended business logic and document it; currently undocumented. |
| Notification dedup missing | Schema | Bug | Medium | Med | M | — | `createNotification()` does a plain INSERT with no ON CONFLICT guard. Duplicate (userId, type, entityType, entityId) rows possible on retried requests or double-run of `expire-stale`. Add unique index + `onConflictDoNothing()` to prevent spam. |
| Food reservation expiry: owner not notified | Backend | Bug | Easy | Low | S | ✅ | `POST /api/admin/expire-stale` notifies food requester on expiry but not the food share owner. Owner should also receive `food_reservation_cancelled` so they know the pending slot freed up. |
| `skills.categoryId` / `tools.categoryId` missing FK | Schema | Bug | Easy | Med | S | — | Both columns reference `categories(id)` but have no `.references()` FK constraint in schema.ts. Category deletion leaves orphaned skills/tools with no DB-level guard. Add `references(() => categories.id, { onDelete: 'set null' })`. |
| `good_neighbor` badge criterion is listings, not exchanges | Gamification | Bug | Easy | Low | S | — | ✅ Fixed 2026-05-17 — `checkAndAwardBadges` now counts `foodReservations WHERE status='picked_up' AND ownerId=userId >= 5`. Previously counted food listings created, which allowed badge farming by posting and deleting. |
| `aiConversations` orphan cleanup after data-retention | Backend | Bug | Easy | Low | S | — | ✅ Fixed 2026-05-17 — `POST /api/admin/data-retention` now deletes `aiConversations` with no remaining messages (via `notExists` subquery) immediately after message deletion. |
| `checkAndAwardBadges` 9-query fan-out performance | Performance | Infra | Easy | Low | M | — | Every gamification event (RSVP, tool return, food pickup) fires 9 parallel DB queries to check all badge criteria. At 1k+ DAU with frequent events this creates significant Neon connection pressure. Consider adding a `user_badge_check_cooldown` (e.g. skip if last check was <60s ago) or caching badge state in `user_stats`. |
| Block/unblock not audited | Security | Refactor | Easy | Low | S | ✅ | ✅ Done 2026-05-17 — `POST` and `DELETE /api/users/[id]/block` now call `writeAuditLog`. Response shape also normalized to `{ data: { blocked: bool } }`. |
| Report creation rate limit too permissive | Security | Refactor | Easy | Low | S | ✅ | ✅ Done 2026-05-17 — `POST /api/reports` now applies `createRatelimit` (10/hr per user) in addition to `apiRatelimit`. Prevents mass-reporting abuse. |
| `state-machine.ts` orphaned utility | Refactor | Refactor | Medium | Low | M | — | ✅ Done 2026-05-17 — Deleted both files. Inline validation is the correct pattern here. |
| `buildSystemPrompt` silent catch | Bug | Easy | Low | S | ✅ | ✅ Done 2026-05-17 — The DB fallback catch in `ai/chat/route.ts:buildSystemPrompt` now logs the error instead of swallowing it silently. |
| `food-reservations GET` filters in app-code | Performance | Refactor | Easy | Low | S | — | `GET /api/food-shares/[id]/reservations` loads all reservations then filters non-owner rows in JS. For popular shares with many reservations, add a `WHERE requester_id = $user` clause at DB level when caller is not the owner. |
| `requireAuth` doesn't block deleted/locked users | Security | Design | Medium | Med | M | ✅ Done 2026-05-17 (partial) | `requireVerifiedAuth` now checks `deletedAt IS NULL` and `lockedUntil`. Plain `requireAuth` (read-only routes) still trusts JWT only — deleted users can read data for up to 15 min. Acceptable tradeoff for stateless JWT, but consider a token revocation list if stricter logout is needed. |
| Skill request requester can't cancel ACCEPTED state | Backend | UX | Easy | Low | S | ✅ | ✅ Not a bug — code review confirmed `CANCELLABLE_STATUSES = [PENDING, ACCEPTED]` and the PENDING-only guard applies only to PENDING. Both owner and requester can cancel an ACCEPTED request. ROADMAP entry was incorrect. |
| AI prompt injection via skill title / owner name | Security | Bug | Easy | Med | S | ✅ Done 2026-05-17 | `GET /api/ai/summary` built skillList with unsanitized `r.title` and `r.ownerName`. A user could craft profile name or skill title with injected instructions. Fixed by applying existing `sanitize()` to those fields. |
| Description fields unbounded text() | Schema | Bug | Easy | Low | M | — | `skills.description`, `tools.description`, `events.description`, `communityDrives.description`, `foodShares.description`, `ratings.comment`, `skillRequests.notes` are all `text()` with no length limit. Add DB-level CHECK constraints (e.g. `char_length(description) <= 5000`) to prevent multi-MB payload injection through the API. |
| `users/search` allows email enumeration | Privacy | Design | Easy | Low | S | — | `GET /api/users/search` searches by `ilike(email, pattern)` so an authenticated user can confirm whether an email is registered. Response returns only `id/name/avatar` (not the email). Intentional for "find by email" UX, but not documented. Decide: keep as-is or restrict to name-only search. |

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
| Mutation testing (Stryker) | M | Run Stryker on `lib/badges.ts` to verify tests actually catch regressions. |

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
