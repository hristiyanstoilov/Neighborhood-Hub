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
│   │   │   │   │   ├── ratings/         # POST create rating, GET list by user, GET check
│   │   │   │   │   ├── search/          # GET unified cross-module full-text search
│   │   │   │   │   ├── admin/           # admin users, audit log, dashboard
│   │   │   │   │   └── ai/              # AI chat + conversation history
│   │   │   │   └── (web)/       # Web pages (server + client components)
│   │   │   ├── components/      # Shared React components
│   │   │   ├── contexts/        # Auth context
│   │   │   ├── db/
│   │   │   │   ├── schema.ts    # Drizzle schema (21 tables)
│   │   │   │   ├── index.ts     # DB connection (neon-http)
│   │   │   │   ├── seed.ts      # Seed: locations, categories, demo users, skills, tools, food, events, drives, ratings
│   │   │   │   └── migrations/  # SQL migration files
│   │   │   └── lib/
│   │   │       ├── auth.ts      # JWT sign/verify + token helpers
│   │   │       ├── middleware.ts # requireAuth / requireAdmin
│   │   │       ├── ratelimit.ts # Upstash rate limiters (login, register, AI, API, search)
│   │   │       ├── email.ts     # Resend email templates (green brand)
│   │   │       ├── audit.ts     # Audit log writer
│   │   │       ├── api.ts       # Client fetch helper (auto Content-Type, token refresh)
│   │   │       ├── format.ts    # Shared formatters: formatDate, formatDateTime, status classes, humanizeValue
│   │   │       ├── query-keys.ts # Central TanStack Query key registry (skills, tools, events, drives, food, ratings, search, notifications, profile, chat)
│   │   │       ├── queries/     # Reusable DB query functions
│   │   │       └── schemas/     # Zod validation schemas (per domain: rating.ts, search.ts, …)
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

## 4. Database Schema (21 tables)

### Core tables (all built)

| Table | Purpose |
|-------|---------|
| `users` | Auth only (email, password_hash, role, failed_login_attempts, locked_until, deleted_at) |
| `profiles` | Profile data (user_id FK, name, bio, avatar_url, location_id FK, is_public, avg_rating, rating_count) |
| `refresh_tokens` | JWT refresh tokens (user_id FK, token, is_revoked, expires_at, ip_address) |
| `audit_log` | Admin action log (user_id FK, action, entity, entity_id, metadata jsonb, ip_address) |
| `categories` | Normalized skill categories (slug UNIQUE, label) |
| `user_consents` | GDPR consent tracking (user_id FK, consent_type, granted, granted_at, revoked_at, version) |
| `skills` | Skill listings (owner_id FK, title, category_id FK, available_hours, status, image_url, location_id FK, deleted_at) |
| `skill_requests` | Booking requests (user_from_id FK, user_to_id FK, skill_id FK, scheduled_start, scheduled_end, meeting_type, meeting_url, status) |
| `locations` | Geo data for radar map (city, neighborhood, lat, lng – neighborhood centroid only, country_code, type) |
| `notifications` | In-app notifications (user_id FK, type, entity_type, entity_id, is_read) |
| `ai_conversations` | AI chat sessions (user_id FK, title) |
| `ai_messages` | AI chat messages (conversation_id FK, role, content) |
| `tools` | Tool listings (owner_id FK, title, condition, category_id FK, location_id FK, status, deleted_at) |
| `tool_reservations` | Borrow requests (tool_id FK, borrower_id FK, start_date, end_date, status, cancellation_reason) |
| `events` | Neighborhood events (organizer_id FK, title, description, status, starts_at, ends_at, address, image_url, max_capacity, location_id FK, deleted_at) |
| `event_attendees` | RSVP records (event_id FK, user_id FK, status) |
| `community_drives` | Charity/donation drives (organizer_id FK, title, description, drive_type, status, deadline, goal_description, drop_off_address, image_url, deleted_at) |
| `drive_pledges` | Pledge records (drive_id FK, user_id FK, pledge_description, status) |
| `food_shares` | Food listings (owner_id FK, title, quantity, location_id FK, available_until, pickup_instructions, image_url, status, deleted_at) |
| `food_reservations` | Food reservations (food_share_id FK, requester_id FK, pickup_time, notes, status, picked_up_at) |
| `ratings` | Peer ratings (rater_id FK, rated_user_id FK, context_type, context_id, score 1–5, comment) — one per rater per completed exchange; updates avg_rating/rating_count on profiles |

> **Full-text search:** `skills`, `tools`, `events`, `community_drives`, `food_shares` each have a generated `search_vector tsvector` column (STORED) with a GIN index. Used by `GET /api/search`. Dictionary: `'english'` for all except `food_shares` (`'simple'` — Bulgarian titles).

**Rules:**
- Always use Drizzle migrations (`drizzle-kit generate` + `drizzle-kit migrate`)
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
| Search (cross-module) | `/search` | ✅ done |

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
| Search (cross-module) | ✅ done |

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
- TanStack Query key convention: use `src/lib/query-keys.ts` as the central registry; namespaces: `skills`, `skillRequests`, `tools`, `events`, `drives`, `food`, `ratings`, `search`, `notifications`, `profile`, `chat`; keys are always arrays starting with a domain string; user-scoped keys include `userId`; infinite query keys must NOT include pagination params (page/offset/limit); default config in `WebUIProvider` (`staleTime: 15_000`, `retry: 1`, `refetchOnWindowFocus: false`)
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

### What Claude should NOT do
- Change the tech stack without being asked
- Add features beyond the current phase (v0.1) unless asked
- Use Prisma instead of Drizzle
- Use class components in React
- Skip Drizzle migrations when changing DB schema
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
