# Neighborhood Hub – AI Agent Instructions

## 1. Project Overview

**Neighborhood Hub** is a multi-platform full-stack app for Bulgarian neighborhoods that enables skill sharing, time swapping, tool lending, food sharing, and community events.

- **Course:** Full Stack Apps with AI – SoftUni
- **Type:** Capstone project
- **Status:** Phase 1 – Active development

Users can register, browse and offer skills/tools/food in their neighborhood, request time slots, and communicate through a neighborhood radar map.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Next.js (App Router) + TypeScript |
| Database | Neon PostgreSQL + Drizzle ORM |
| Auth | JWT tokens (custom middleware) |
| Web Frontend | React + TypeScript + Tailwind CSS |
| Mobile | React Native + Expo |
| Storage | Cloudflare R2 (photos/files) |
| Deployment | Netlify (serverless) |

---

## 3. Monorepo Structure

```
neighborhood-hub/
├── packages/
│   ├── nextjs/                  # Backend API + Web frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── api/         # REST API routes
│   │   │   │   │   ├── auth/    # register, login, logout, refresh, me, verify-email,
│   │   │   │   │   │            # resend-verification, forgot-password, reset-password
│   │   │   │   │   ├── skills/  # CRUD skill listings
│   │   │   │   │   ├── skill-requests/  # booking state machine
│   │   │   │   │   ├── notifications/   # in-app notifications
│   │   │   │   │   ├── profile/         # user profile
│   │   │   │   │   ├── upload/          # Cloudflare R2 image upload
│   │   │   │   │   ├── tools/           # CRUD tool listings
│   │   │   │   │   ├── tool-reservations/ # reservation state machine
│   │   │   │   │   ├── events/          # CRUD events + attendees (RSVP)
│   │   │   │   │   ├── drives/          # CRUD community drives + pledges
│   │   │   │   │   ├── food-shares/     # CRUD food listings + reservations state machine
│   │   │   │   │   ├── food-reservations/ # list user reservations across all food shares
│   │   │   │   │   ├── admin/           # admin users, audit log, dashboard
│   │   │   │   │   └── ai/              # AI chat + conversation history
│   │   │   │   └── (web)/       # Web pages (server + client components)
│   │   │   ├── components/      # Shared React components
│   │   │   ├── contexts/        # Auth context
│   │   │   ├── db/
│   │   │   │   ├── schema.ts    # Drizzle schema (20 tables)
│   │   │   │   ├── index.ts     # DB connection (neon-http)
│   │   │   │   ├── seed.ts      # Seed locations, categories, demo users, skills/requests, tools/reservations
│   │   │   │   └── migrations/  # SQL migration files
│   │   │   └── lib/
│   │   │       ├── auth.ts      # JWT sign/verify + token helpers
│   │   │       ├── middleware.ts # requireAuth / requireAdmin
│   │   │       ├── ratelimit.ts # Upstash rate limiters
│   │   │       ├── email.ts     # Resend email templates (green brand)
│   │   │       ├── audit.ts     # Audit log writer
│   │   │       ├── api.ts       # Client fetch helper (auto Content-Type, token refresh)
│   │   │       ├── queries/     # Reusable DB query functions
│   │   │       └── schemas/     # Zod validation schemas
│   │   └── package.json
│   └── mobile/                  # React Native mobile app (Expo 54)
│       ├── app/
│       │   ├── (app)/           # Authenticated screens
│       │   └── (auth)/          # Login / Register screens
│       ├── components/          # Shared RN components
│       ├── contexts/            # Auth context (mobile)
│       └── lib/                 # API client, SecureStore token storage, format utils, toast
├── docs/                        # Product documentation and roadmap
├── AGENTS.md
└── README.md
```

---

## 4. Database Schema (31 tables)

### Core tables (all built)

| Table | Purpose |
|-------|---------|
| `users` | Auth only (email, password_hash, role, failed_login_attempts, locked_until, deleted_at) |
| `profiles` | Profile data (user_id FK, name, bio, avatar_url, location_id FK, default_location_id FK, avg_rating, rating_count, is_public) |
| `refresh_tokens` | JWT refresh tokens (user_id FK, token, is_revoked, expires_at, ip_address, user_agent) |
| `audit_log` | Admin action log (user_id FK, action, entity, entity_id, metadata jsonb, ip_address) |
| `categories` | Normalized skill categories (slug UNIQUE, label, icon) |
| `user_consents` | GDPR consent tracking (user_id FK, consent_type, granted, granted_at, revoked_at, version) |
| `user_stats` | Gamification points (user_id FK UNIQUE, total_points, level) |
| `badges` | Achievement records (user_id FK, type enum, awarded_at) — unique per user+type |
| `skills` | Skill listings (owner_id FK, title, category_id FK, available_hours, status, image_url, location_id FK, deleted_at) |
| `skill_endorsements` | Neighbor endorsements (skill_id FK, endorser_id FK) — unique per skill+endorser |
| `skill_requests` | Booking requests (user_from_id FK, user_to_id FK, skill_id FK, scheduled_start, scheduled_end, meeting_type, meeting_url, status, completed_at) |
| `locations` | Geo data for radar map (city, neighborhood, lat, lng – neighborhood centroid only, country_code, type) |
| `notifications` | In-app notifications (user_id FK, type, entity_type, entity_id, is_read) |
| `ai_conversations` | AI chat sessions (user_id FK, title, deleted_at) |
| `ai_messages` | AI chat messages (conversation_id FK, role, content) |
| `tools` | Tool listings (owner_id FK, title, condition, category_id FK, location_id FK, status, deleted_at) |
| `tool_reservations` | Borrow requests (tool_id FK, borrower_id FK, owner_id FK, start_date, end_date, return_by, status, cancellation_reason) |
| `events` | Neighborhood events (organizer_id FK, title, description, status, starts_at, ends_at, address, image_url, max_capacity, location_id FK, deleted_at) |
| `event_attendees` | RSVP records (event_id FK, user_id FK, status) |
| `community_drives` | Charity/donation drives (organizer_id FK, title, description, drive_type, status, deadline, goal_description, goal_amount, current_amount, drop_off_address, image_url, deleted_at) |
| `drive_pledges` | Pledge records (drive_id FK, user_id FK, pledge_description, status) |
| `food_shares` | Food listings (owner_id FK, title, quantity, location_id FK, available_until, pickup_instructions, image_url, status, deleted_at) |
| `food_reservations` | Food reservations (food_share_id FK, requester_id FK, owner_id FK, pickup_at, notes, status, picked_up_at, cancellation_reason) |
| `ratings` | 5-star feedback (rater_id FK, rated_user_id FK, context_type, context_id, score 1–5, comment) |
| `conversations` | DM threads (participant_a FK, participant_b FK — ordered pair, unique) |
| `messages` | DM content (conversation_id FK, sender_id FK, body, read_at) |
| `push_tokens` | Expo push tokens for mobile notifications (user_id FK, token UNIQUE, platform) |
| `reports` | Content moderation (reporter_id FK, target_type, target_id, reason, status, reviewed_by_id FK) |
| `user_blocks` | User safety (blocker_id FK, blocked_id FK — ordered pair, unique) |

**Rules:**
- Always use Drizzle migrations (`drizzle-kit generate` + `npm run db:migrate` via `scripts/migrate.ts` — do NOT use `drizzle-kit migrate` directly, it hangs with Neon's HTTP driver)
- Commit migration SQL files to GitHub
- Use `uuid` primary keys
- Add `created_at` / `updated_at` to every table

---

## 5. Business Logic Rules

### Skill Request Lifecycle

State machine:
```
pending ──[owner accepts]──→ accepted ──[requester confirms]──→ completed
   │                            │
   │                            └──[anyone cancels + reason]──→ cancelled
   ├──[owner rejects]──→ rejected
   └──[requester cancels]──→ cancelled
```

Rules:
- `pending → accepted` / `pending → rejected`: only `user_to_id` (skill owner)
- `pending → cancelled`: only `user_from_id` (requester)
- `accepted → completed`: only `user_from_id` (requester confirms they received the service)
- `accepted → cancelled`: both parties can cancel, `cancellation_reason` required
- `skills.status` does NOT change automatically on request accept – owner manages it manually
- Multiple parallel `accepted` requests per skill are allowed (no collision detection in MVP)
- Invalid transitions must return `400 INVALID_STATUS_TRANSITION`

---

## 6. Authentication & Authorization

- JWT tokens – custom middleware in `src/lib/auth.ts`
- Roles: `user` (default) and `admin`
- All API routes must check auth via middleware
- Admin panel at `/admin` – accessible only to `role: admin`
- Endpoints that mutate data require auth header: `Authorization: Bearer <token>`

### Email Verification
- Provider: **Resend** (`npm install resend`) – 3000 emails/month free tier
- Strategy: **soft block** – user can login without verified email, but cannot create skill listings
- Token: stored in `users` table as `email_verification_token varchar(64)` + `email_verification_expires_at timestamptz`
- Token format: `crypto.randomBytes(32).toString('hex')`
- Token TTL: **24 hours**
- Flow: register → generate token → insert to DB → Resend sends email with link → user clicks → API checks token + expiry → set `email_verified_at = now()`, clear token
- `POST /api/skills/create` must check `email_verified_at` – if NULL → return `403 UNVERIFIED_EMAIL`
- Add env var: `RESEND_API_KEY`

### JWT Configuration
- `access_token` TTL: **15 minutes**
- `refresh_token` TTL: **7 days** – store in `httpOnly` cookie (web) or secure storage (mobile)
- `JWT_SECRET`: minimum 256-bit random string (`openssl rand -base64 32`)
- Refresh token **rotation**: on every `/api/auth/refresh` – revoke old token (`is_revoked=true`), insert new token

### Password Hashing
- Use **bcrypt** with cost factor **12**
- Never use MD5, SHA1, or SHA256 for passwords

### Account Lockout
- After **5 failed login attempts** → set `locked_until = now() + 15 minutes`
- On successful login → reset `failed_login_attempts = 0`
- Check `locked_until` before attempting password compare

### Rate Limiting
- Use `@upstash/ratelimit` + Upstash Redis (free tier, works on Netlify edge)
- Limits:
  - `POST /api/auth/login` → 5 req / 15 min / IP
  - `POST /api/auth/register` → 3 req / hour / IP
  - `POST /api/ai/chat` → 20 req / hour / user (Anthropic cost protection)
  - All other API routes → 100 req / min / user

### Authorization Rules
- **Always** check ownership on mutations: filter by `owner_id` / `user_id`, not just by resource `id`
- Pattern: `WHERE id = $1 AND owner_id = $userId` on UPDATE/DELETE for `skills`, `ai_conversations`
- Pattern: `WHERE id = $1 AND (user_from_id = $userId OR user_to_id = $userId)` for `skill_requests`

---

## 7. Required Screens (minimum 5 web + 3 mobile)

### Web screens (Next.js)

| Screen | Route | Status |
|--------|-------|--------|
| Home / Dashboard | `/` | ✅ done |
| Register | `/register` | ✅ done |
| Login | `/login` | ✅ done |
| Forgot Password | `/forgot-password` | ✅ done |
| Reset Password | `/reset-password` | ✅ done |
| Verify Email | `/verify-email` | ✅ done |
| Skill List + Search + Filters | `/skills` | ✅ done |
| Skill Detail + Request modal | `/skills/[id]` | ✅ done |
| Create Skill | `/skills/new` | ✅ done |
| Edit Skill | `/skills/[id]/edit` | ✅ done |
| My Requests | `/my-requests` | ✅ done |
| Profile View | `/profile` | ✅ done |
| Profile Edit | `/profile/edit` | ✅ done |
| Admin — Users | `/admin/users` | ✅ done |
| Admin — Audit Log | `/admin/audit` | ✅ done |
| AI Chat | `/chat` | ✅ done |
| Public Profiles | `/users/[id]` | ✅ done |
| Tool Library | `/tools` | ✅ done |
| Tool Detail + Reserve | `/tools/[id]` | ✅ done |
| Create Tool | `/tools/new` | ✅ done |
| Edit Tool | `/tools/[id]/edit` | ✅ done |
| My Reservations | `/my-reservations` | ✅ done |
| Events List + Filters | `/events` | ✅ done |
| Event Detail + RSVP | `/events/[id]` | ✅ done |
| Create Event | `/events/new` | ✅ done |
| Edit Event | `/events/[id]/edit` | ✅ done |
| Community Drives List | `/drives` | ✅ done |
| Drive Detail + Pledge | `/drives/[id]` | ✅ done |
| Create Drive | `/drives/new` | ✅ done |
| Edit Drive | `/drives/[id]/edit` | ✅ done |
| Admin — Dashboard | `/admin/dashboard` | ✅ done |
| Food List + Search | `/food` | ✅ done |
| Food Detail + Reserve | `/food/[id]` | ✅ done |
| Create Food Share | `/food/new` | ✅ done |
| Edit Food Share | `/food/[id]/edit` | ✅ done |
| My Food Reservations | `/food/reservations` | ✅ done |
| Notifications | `/notifications` | ✅ done |
| My Events (RSVPs) | `/my-events` | ✅ done |
| My Pledges (Drives) | `/my-drives` | ✅ done |

### Mobile screens (Expo 54)

| Screen | Status |
|--------|--------|
| Login | ✅ done |
| Register | ✅ done |
| Skill List (paginated) | ✅ done |
| Skill Detail + Request | ✅ done |
| Create Skill | ✅ done |
| Edit Skill | ✅ done |
| Request Skill | ✅ done |
| My Requests (Sent / Received) | ✅ done |
| My Skills | ✅ done |
| Notifications | ✅ done |
| Profile + Avatar Upload | ✅ done |
| Edit Profile | ✅ done |
| Public User Profile | ✅ done |
| AI Chat | ✅ done |
| Neighborhood Radar | ✅ done |
| Tool Library | ✅ done |
| Tool Detail + Reserve | ✅ done |
| Events List (paginated) | ✅ done |
| Event Detail + RSVP | ✅ done |
| Create Event | ✅ done |
| Drives List (paginated) | ✅ done |
| Drive Detail + Pledge | ✅ done |
| Create Drive | ✅ done |
| Forgot Password | ✅ done |
| Food List (paginated) | ✅ done |
| Food Detail + Reserve | ✅ done |
| Create Food Share | ✅ done |
| Edit Food Share | ✅ done |
| My Tool Reservations | ✅ done |
| My Food Reservations | ✅ done |
| My Events (RSVPs) | ✅ done |
| My Pledges (Drives) | ✅ done |

---

## 8. Module Status

| Version | Module | Status |
|---------|--------|--------|
| 0.1 | Neighborhood Radar + Time & Skill Swap | ✅ Done |
| 0.2 | Tool Library | ✅ Done |
| 0.3 | Events + Community Drives (Charity) | ✅ Done |
| 0.4 | Food Sharing | ✅ Done |
| 0.5 | Chat / Feed | Later |

> **Community Drives are NOT "charity events"** — they are a separate module with their own tables (`community_drives`, `drive_pledges`), API routes (`/api/drives`), and screens.
> Events have their own tables (`events`, `event_attendees`), API routes (`/api/events`), and screens.
> Food Sharing (v0.4) has its own tables (`food_shares`, `food_reservations`), API routes (`/api/food-shares`, `/api/food-reservations`), and screens.

---

## 9. Coding Rules

### General
- Use **TypeScript strictly** – no `any` unless unavoidable
- No inline CSS – use Tailwind classes only
- No `console.log` in production code
- Always handle errors in API routes (try/catch + proper status codes)
- Validate all request bodies with **zod** before DB operations – never trust client input
- Never expose `password_hash`, `refresh_tokens`, or `ip_address` in API responses or AI context

### Backend (Next.js API routes)
- File pattern: `src/app/api/[resource]/[action]/route.ts`
- Always validate request body with **zod** before DB operations
- Use Drizzle ORM – never raw SQL unless complex query requires it
- Return consistent JSON: `{ data }` on success, `{ error }` on failure
- Add security headers in `next.config.ts`: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy`
- CORS: explicit allowed origins only – never `Access-Control-Allow-Origin: *` on authenticated endpoints
- File uploads (Cloudflare R2): `POST /api/upload` — validate MIME type server-side (`image/jpeg`, `image/png`, `image/webp` only), generate UUID filename, max 5 MB, return `{ data: { url } }`. Use `@aws-sdk/client-s3` with `PutObjectCommand`. Never set `Content-Type: application/json` when sending `FormData` from the client — `apiFetch` handles this automatically.
- AI routes: system prompt must contain explicit boundaries; never include sensitive DB fields in AI context; rate-limit per `user_id`

### Database (Drizzle + Neon)
- Schema lives in `packages/nextjs/src/db/schema.ts`
- After schema changes: `npx drizzle-kit generate` → `npx drizzle-kit migrate` → commit SQL files
- **Never** use `drizzle-kit push` in production – migrations only
- Use `pgEnum` ONLY for stable binary fields: `users.role` ('user'|'admin'), `ai_messages.role` ('user'|'assistant')
- Use `VARCHAR + CHECK constraint` for all status/type fields that may evolve (skill_requests.status, skills.status, locations.type, meeting_type) – `ALTER TYPE` doesn't work in transactions in Neon
- Use `.references()` with `onDelete: 'cascade'` for foreign keys
- Soft delete on `skills` and `users` – add `deleted_at` column, never hard DELETE
- Use `@neondatabase/serverless` driver with `drizzle-orm/neon-http` – HTTP transport for query execution (do not use `db.transaction` with this driver)
- Auth data (`email`, `password_hash`) lives in `users`; profile data (`name`, `bio`, `avatar_url`) lives in `profiles` – NO city/neighborhood in profiles, derive via `location_id FK → locations`
- Store `refresh_tokens` in DB to enable logout invalidation
- Log admin actions to `audit_log` table
- Location data is neighborhood-level only – no exact coordinates (GDPR)
- Required indexes: `skills(owner_id)`, `skills(status)` partial WHERE deleted_at IS NULL, `skills(category_id)`, `skill_requests(user_from_id)`, `skill_requests(user_to_id)`, `skill_requests(user_from_id, status)` composite, `notifications(user_id)`, `notifications(user_id, is_read)` partial WHERE is_read=false, `ai_conversations(user_id)`, `ai_messages(conversation_id)`, `locations(lat, lng)` btree for geo queries
- `meeting_url` on `skill_requests` – required for online/hybrid meetings
- `notifications` table is required – status changes on skill_requests must trigger notification inserts
- `ai_conversations` + `ai_messages` tables required – AI chat must be persisted (important for course grading)
- `locations.lat` + `locations.lng` are neighborhood centroids (public geo data) – GDPR compliant; required for radar map markers
- `profiles.location_id` FK → locations – required to filter "skills in my neighborhood"

### Frontend (React + Tailwind)
- Each page in `src/app/(web)/[page]/page.tsx`
- Components in `src/components/`
- Follow Step 7 "Modular React Components": split large screens into reusable components and feature folders.
- Refactors for modularization must preserve existing behavior (structure-only improvement, no hidden logic changes unless explicitly requested).
- Use `fetch` or `axios` for API calls
- Responsive design – mobile-first with Tailwind breakpoints
- TanStack Query key convention: use `src/lib/query-keys.ts` as the central registry; keys are always arrays starting with a domain string; user-scoped keys include `userId`; default config in `WebUIProvider` (`staleTime: 15_000`, `retry: 1`, `refetchOnWindowFocus: false`)
- Status formatting: use helpers from `src/lib/format.ts` (`eventStatusClass`, `rsvpStatusClass`, `driveStatusClass`, `pledgeStatusClass`, `formatEventStatus`, `humanizeValue`) — do not add inline status color maps to screens

### Mobile (Expo 54)
- Screens in `packages/mobile/app/(app)/` (authenticated) and `packages/mobile/app/(auth)/` (login/register)
- Use Expo Router for navigation
- API base URL in env variable `EXPO_PUBLIC_API_URL`
- Use `FlatList` for lists (with pagination), `ScrollView` for detail pages
- Image picker: `expo-image-picker` — always request permission, use `asset.mimeType` for correct MIME type
- `apiFetch` skips `Content-Type` header for `FormData` bodies automatically — do not override

---

## 10. Capstone Scoring Checklist

| Requirement | Target | Notes |
|-------------|--------|-------|
| GitHub commits | 15+ | 1 per working feature |
| Commit days | 3+ different days | Spread work over time |
| Architecture | monorepo + client-server | packages/nextjs + packages/mobile |
| Backend API | endpoints with auth | JWT middleware on all routes |
| DB tables | 4+ tables | users, skills, skill_requests, locations |
| Auth & Security | JWT + roles | user / admin roles |
| Web screens | 5+ screens | See screen list above |
| Admin panel | /admin route | Only for admin role |
| Mobile screens | 3+ screens | 15 screens implemented (see section 7) |
| Deployment | Live on Netlify | With Neon DB |
| Documentation | README.md in GitHub | Schema, setup, API docs |

---

## 11. How AI Agents Should Help

### General Rule
Do not make any changes until you have 95% confidence in what you need to build. Ask follow-up questions until you reach that confidence.

### Code generation
- Generate Drizzle schema and migrations
- Generate Next.js API route handlers
- Generate React components and pages
- Generate React Native screens
- Generate JWT middleware and auth helpers

### Code review
- Check for missing auth on API routes
- Check for TypeScript errors
- Check for SQL injection or security issues
- Suggest missing indexes on DB tables

### Documentation
- Update README.md with new screens or API endpoints
- Keep AGENTS.md in sync when architecture changes
- Generate JSDoc comments for complex functions

### ROADMAP Maintenance Protocol
After every batch of completed tasks (or at the start of a session involving code review), verify `docs/ROADMAP.md` against the actual codebase:
1. **Spot-check P1/P2 items** — `grep` or `find` for the feature file/route. If it exists and works, mark it done or remove it.
2. **Remove completed items** — delete rows from backlog tables once confirmed done. Do not accumulate ✅ markers forever; clean rows that are clearly done.
3. **Correct wrong descriptions** — fix items that describe something as missing when it's actually implemented.
4. **Update the `Last updated` date** at the top.
5. **Document deferred findings immediately** — if a bug or improvement is found during a code review or audit but is NOT fixed right away (because scope shifted, time ran out, or a different direction was chosen), add it to the appropriate priority bucket in `docs/ROADMAP.md` before moving on. Never leave an unresolved finding only in conversation history.

Trigger: after every 5+ file changes in a session, or before generating new junior-agent prompts, or when the user asks to "check the roadmap".

### What Claude should NOT do
- Change the tech stack without being asked
- Add features beyond the current phase (v0.1) unless asked
- Use Prisma instead of Drizzle
- Use class components in React
- Skip Drizzle migrations when changing DB schema
- Add ratings/reviews to MVP (separate UX flow, out of scope)
- Store exact user lat/lng – only neighborhood centroids in `locations` (GDPR)
- Skip `notifications` table – status changes on requests must create notification rows
- Skip `ai_conversations`/`ai_messages` – AI chat must be persisted, not stateless
- Create a separate Charity module (use `event_type: 'charity'` instead)
- Use MD5/SHA1/SHA256 for password hashing – bcrypt cost=12 only
- Skip ownership check on mutations – always filter by `owner_id`/`user_id`
- Skip zod validation on API routes – validate every request body
- Use `Access-Control-Allow-Origin: *` on authenticated endpoints
- Include `password_hash`, `refresh_tokens`, or `ip_address` in API responses or AI context
- Skip rate limiting on auth and AI endpoints

---

## 12. Example Prompts

```
"Generate Drizzle schema for the skills table with all required fields"
"Generate Next.js API route for POST /api/skills/create with JWT auth"
"Generate React component SkillCard with Tailwind CSS"
"Generate Expo screen SkillListScreen that fetches from the API"
"Add JWT middleware to protect the /api/skills/create route"
"Generate Drizzle migration for adding the locations table"
"Review this API route for security issues"
```

> **Note**: n8n workflow automation instructions have been extracted to separate documentation files.
> This AGENTS.md focuses exclusively on Neighborhood Hub development.
> Code generation guidelines for Next.js, React, React Native, PostgreSQL/Drizzle, and authentication remain in sections above.

<!-- n8n-as-code-start -->
<!-- n8nac-version: 2.2.0 -->

## n8n-as-code Context Root

This file is generated by `npx --yes n8nac update-ai`. It is bootstrap context only, not a configuration source of truth.

- Context root: `c:\VS Code Softuni\Neighborhood Hub`
- n8n version at generation time: 2.2.5
- n8nac command: `npx --yes n8nac`
- n8n-manager command: `npx --yes @n8n-as-code/n8n-manager`
- n8n knowledge command: `npx --yes n8nac skills`

Run workspace commands from this context root. Do not `cd` into the n8n-as-code source repository, n8n-manager source repository, plugin directory, or package directory to run `npx --yes n8nac workspace ...`, `npx --yes n8nac list`, `npx --yes n8nac pull`, `npx --yes n8nac push`, or `npx --yes n8nac update-ai`.

---

## Required Local Agent

A VS Code and GitHub Copilot-compatible agent is generated here:

- `.github/agents/n8n-architect.agent.md`

A portable skill fallback is also generated for runtimes that do not read `.github/agents`:

- `.agents/skills/n8n-architect/SKILL.md`

If your agent runtime supports workspace agents, use the `.github/agents/*.agent.md` file. If it supports skills instead, load the skill file. Otherwise, treat these files as mandatory instructions.

---

## Source Of Truth

Do not infer configuration from this file. It intentionally avoids storing the effective instance, project, sync folder, or workflow directory.

n8nac backend resolution remains the only source of effective workspace state.
- Workspace environments live in `n8nac-config.json` and are managed by `npx --yes n8nac env ...`.
- Managed local runtime state and secrets live in n8n-manager storage and are managed by `npx --yes @n8n-as-code/n8n-manager ...`.
- The effective context is resolved by the backend.

Before any n8n workflow command, run migration dry-run first, then workspace status only after migration is not required or has been applied:

```bash
cd c:\VS Code Softuni\Neighborhood Hub
npx --yes n8nac workspace migrate --json
npx --yes n8nac workspace status --json
```

Use the returned `workflowDir` exactly as provided. Treat it as an opaque backend-derived path that may contain generated or hashed segments.
`syncFolder` is only the user-configured sync root, not the workflow directory. Do not reconstruct `workflowDir` from `syncFolder`, environment name/id, instance identifier, instance user identifier, project id, or project name.

---

## Safe Commands

- Primary workspace, environment, sync, validation, push, and pull work: `npx --yes n8nac ...`
- Local managed runtime lifecycle and tunnels only: `npx --yes @n8n-as-code/n8n-manager ...`
- Workspace status and migration: `npx --yes n8nac workspace ...`
- Workflow sync and validation: `npx --yes n8nac ...`
- Node knowledge and schema lookup: `npx --yes n8nac skills ...`

Never write `n8nac-config.json`, `~/.n8n-manager`, or n8n-manager secret files by hand.
<!-- n8n-as-code-end -->
