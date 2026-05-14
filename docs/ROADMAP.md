# Neighborhood Hub – Roadmap

> Last updated: 2026-05-15 (batch 12)

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
| Infrastructure cost model | Document free tier limits and projected cost at 1k/10k users for: Neon, Netlify, Upstash, Resend, Anthropic, Cloudflare R2. Required before any partner conversation. |

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
| Data breach incident response plan | Document KZLD 72-hour notification procedure (GDPR Art. 33). Private ops runbook. |
| Orphan cleanup job | ✅ Done — `POST /api/admin/cleanup-orphans` added to admin maintenance panel. Covers notifications. ratings and feed_events cleanup are future work. |

---

### P4 – Design & UX Polish

| Item | Description |
|------|-------------|
| Brand typography | ✅ Done — Inter font via `next/font/google` with latin + cyrillic subsets. |
| CTA color differentiation | ✅ Done — Primary action buttons changed to `emerald-600`; nav hovers remain `green-700`. |
| Accessibility violations (color-contrast) | **text-gray-400 (#99a1af)** on white bg does not meet WCAG 2.1 AA (current 2.6:1, need 4.5:1). Affects: footer text, "by Owner" metadata, all footer links. Requires Tailwind palette upgrade or component refactoring. Documented in `e2e/accessibility.spec.ts` with `test.skip()`. |
| Accessibility violations (link-in-text-block) | On /login and /register, "Sign in"/"Sign up" links lack visual distinction from surrounding text. Need underline or font-weight change. Requires form redesign. Documented with `test.skip()`. |
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
| Enterprise / business accounts | Analytics dashboard, API access, sponsored listings, white-label. Long-term revenue track. |
| TanStack Query Wave F | Full query migration for food, tools, events on web. Low urgency — all modules stable. |
| Landing page visual rebrand | Hero illustration, testimonials, product screenshots. Post-launch with real users. |
| Shared `packages/shared` types | Shared package for `MapMarker`, `FoodShare`, `ToolReservation` between web and mobile. Eliminates drift. |
| Hourly time slots for tool reservations | Date + time slot (10:00–12:00) for tool handoff coordination. Requires schema change. |
| Multiple images per listing | `attachments` table for multiple images per skill/tool/food/event listing. |
| ISR for public pages | List pages read `searchParams` (opts into dynamic) and home reads `cookies()` — ISR doesn't apply without first refactoring filtering to client-side. Revisit if DB load becomes a real issue at scale. |
| Suspense intra-page streaming | Route-level `loading.tsx` already covers the main UX win. Intra-page `<Suspense>` adds marginal benefit since all data sources are Neon (similar latency). Worth revisiting only if a specific page becomes measurably slow. |

---

## Technical Backlog

> Engineering-focused items — architecture, refactor, and backend correctness. Use this when choosing the next technical task without scanning the full product backlog.

### P3

| Item | Domain | Description |
|------|--------|-------------|
| **DB schema drift: defaultLocationId** | **Migration** | **`profiles` table schema in Drizzle has `defaultLocationId` but DB migration never ran.** `POST /api/auth/register` fails on all E2E tests. Run `cd packages/nextjs && npx drizzle-kit generate && npx drizzle-kit migrate` to fix. Blocks E2E test suite. |
| Contract tests expansion | QA | Skills + skill-requests have contract tests. Add for: tools, food, events, drives, auth. |
| E2E — full skill exchange cycle | QA | Playwright: create skill → request → accept → complete → rate. Full happy path across 5 API calls. [Blocked by DB schema drift above]. |
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
