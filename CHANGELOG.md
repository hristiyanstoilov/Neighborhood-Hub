# Changelog

All notable changes to Neighborhood Hub are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Mobile list screens now use `PagedListView` shell component for consistent loading/error/pagination patterns
- Centralized `mobileTheme` tokens for color, spacing, and typography consistency
- Safe area wrapper (`AppScreen`) for iOS notch/home indicator support
- Daily contribution tracking markers on master branch
- CI: smoke-test jobs now fail on push if `SMOKE_AUTH_EMAIL`/`SMOKE_AUTH_PASSWORD` secrets are missing; authenticated smoke jobs are skipped gracefully when secrets are absent
- Security audit document (`docs/SECURITY_AUDIT.md`) with findings and remediation roadmap
- next-intl i18n coding rules section added to `AGENTS.md`
- Demo seed data enriched with 3 new users (Stoyan/Music, Petya/Design, Dimitar/Gardening), 6 new skills, 4 new tools, 4 new food shares, 2 new events, 1 new drive, and additional conversations

### Fixed
- Mobile paginated lists now preserve stale data on transient fetch errors with inline retry affordance
- Footer spinner behavior stabilized on list refresh
- `PagedListView` error state no longer blanks entire list when showing inline error banner
- `picked_up` reservations no longer appear in the active reservations list on the food detail page, preventing an invalid cancel action
- Missing notification type labels for `drive_pledge_cancelled` and `event_rsvp_cancelled` now resolve to the correct translated string instead of falling back to a generic label
- Seed script is now idempotent: `users` insert uses `.onConflictDoNothing()` so partial-run recovery no longer crashes with `TypeError`

### Changed
- Mobile screen layouts migrated from manual safe-area to `AppScreen` component
- Mobile cards (`SkillCard`, `ToolCard`, `RequestCard`) now use theme tokens instead of hardcoded colors
- Full i18n wiring across all web modules: Skills, Tools, Events, Drives, Food, Leaderboard, auth pages, feed, map, notifications, profile, My Requests, and My Reservations — all hardcoded strings replaced with `t()` calls backed by `en.json`/`bg.json`

---

## [0.1.0] – 2026-04-27

### Added
- **Neighborhood Radar (Map)** – Interactive map with markers by type (skills, tools, events, food, drives)
- **Skill Listings** – CRUD API + Web + Mobile screens for offering skills in neighborhood
- **Skill Requests** – Time & date booking with online/hybrid/in-person meeting formats
- **Time Swap State Machine** – pending → accepted/rejected/cancelled → completed transitions
- **Tool Library** (v0.2 backport) – Borrow and lend tools with reservation management
- **Events Module** (v0.3 backport) – Community events + RSVP attendance tracking
- **Community Drives** (v0.3 backport) – Charity/donation drives with pledge tracking
- **Food Sharing** (v0.4 backport) – Share surplus food with neighborhood pickup scheduling
- **Chat & Feed** (v0.5 backport) – Direct messages + neighborhood activity feed
- **Notifications** – Real-time in-app notifications for request/reservation/event updates
- **Leaderboard & Neighbor Score** – Gamification with point system and user rankings
- **Admin Panel** – User management, audit logging, content reports queue
- **AI Chat** – Anthropic Claude integration for skill recommendations and neighborhood help
- **Web Frontend** – 40+ screens covering all modules with Tailwind CSS design
- **Mobile App** – Expo + React Native with 30+ screens and push notifications
- **Authentication** – JWT tokens, email verification, password reset, account lockout
- **Image Uploads** – Cloudflare R2 integration for skill/food/event avatars
- **Search** – Full-text search across skills, tools, events, drives, food
- **Database** – 27 Drizzle ORM tables with migrations on Neon PostgreSQL
- **Rate Limiting** – Upstash Redis for login/register/AI/API endpoints
- **GDPR Compliance** – Data export (Art. 20), account deletion (Art. 17), soft deletes

### Security
- Bcrypt password hashing (cost factor 12)
- Refresh token rotation on every `/api/auth/refresh`
- Account lockout after 5 failed login attempts (15-minute hold)
- Ownership checks on all mutations (filter by user_id/owner_id)
- Zod validation on all request bodies
- No sensitive fields in API responses (password_hash, ip_address, tokens)

### Deployment
- Next.js app deployed on Netlify (serverless)
- Mobile app via Expo Go + local testing
- Database migrations tracked in Git

---

## Versioning Notes

- **v0.1** – MVP: Neighborhood Radar + Time & Skill Swap (Week 1–4)
- **v0.2–0.5** – Backported into v0.1 scope (Tool Library, Events, Community Drives, Food, Chat)
- **v1.0** – Post-capstone: Production polish, accessibility pass, resilience hardening
- **v2.0+** – Long-term: AI features, analytics, API, partnerships, regional expansion

---

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for:
- MVP Boundary and completion status
- Production Polish Pass (must-haves, nice-to-haves)
- Technical Debt Priority (TanStack Query refactor waves)
- Post-engagement feature backlog

See [docs/BACKLOG_POST_ENGAGEMENT.md](docs/BACKLOG_POST_ENGAGEMENT.md) for items after v0.1.
