# NEIGHBORHOOD HUB — Product Documentation
**Version:** 1.0 | **Date:** April 2, 2026 | **Status:** MVP Active

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Strategy](#2-product-vision--strategy)
3. [Business Model](#3-business-model)
4. [User Segments & Personas](#4-user-segments--personas)
5. [Core User Journeys](#5-core-user-journeys)
6. [Feature Breakdown](#6-feature-breakdown)
7. [System Architecture](#7-system-architecture)
8. [Database Schema](#8-database-schema)
9. [API Reference](#9-api-reference)
10. [Security Model](#10-security-model)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Trade-offs & Product Decisions](#12-trade-offs--product-decisions)
13. [Product Roadmap](#13-product-roadmap)
14. [Design Audit](#14-design-audit)

---

## 1. Executive Summary

### Product Overview
**Neighborhood Hub** is a multi-platform full-stack application for Bulgarian neighborhoods that enables neighbors to share skills, time, tools, food, and organize community events through an interactive radar map.

**Live demo:** *coming soon* | **Demo credentials:** `demo@neighborhood.hub` / `demo123`

### Problem Statement
Bulgarian neighborhoods suffer from three root problems:

- **Discovery gap** — residents who need help or want to offer skills have no structured way to find each other nearby
- **Trust gap** — no verifiable system exists for matching neighbors with the right skills or tools
- **Engagement gap** — community participation is unsustainable without structured, recurring coordination tools

### Target Market
- **Primary:** Residents of Bulgarian neighborhoods seeking to share skills, time, and resources
- **Secondary:** Local NGOs, district administrations, and businesses looking to build community partnerships

### Core Value Proposition
*"Sofia's first neighborhood skill-sharing and time-swapping platform — where every skill offered becomes a community asset."*

The platform converts individual skills and time into a structured, discoverable, and bookable resource for the neighborhood.

### Differentiation

| Dimension | Neighborhood Hub | Generic social platforms | Traditional listings |
|-----------|-----------------|--------------------------|---------------------|
| Skill booking | Full request lifecycle with scheduling | None | Contact form only |
| Neighborhood targeting | Radar map, location-scoped | Global feed | Location filter only |
| Mobile support | React Native + Expo | Responsive web only | Varies |
| Admin oversight | Role-based access + audit log | None | Manual |
| AI assistance | Skill recommendations + chat | None | None |

---

## 2. Product Vision & Strategy

### Vision Statement
*A neighborhood where everyone can give and receive help — structured, convenient, and safe.*

A Bulgaria where every neighborhood has an active skill-sharing community, where time and expertise are accessible to everyone, and where community ties grow stronger through mutual help.

### Strategic Positioning
**Current stage:** Capstone MVP — Phase 1, geographically and feature-constrained for focused delivery.

**Positioning:** Civic tech / community platform — sits at the intersection of time-banking, skill marketplaces, and neighborhood social networks.

### Expansion Potential
The current implementation is a deliberate scope constraint, not a technical limitation. Adding new cities or neighborhoods requires a DB seed — the architecture supports multi-city deployment today.

---

## 3. Business Model

### Current State (Phase 1 — Academic / Grant-funded)
Platform is free for all residents. No payment processing. No revenue.

### Freemium Vision (Post-MVP)

**Design principle:** Core community features (browse skills, request help, radar map) are free forever. Monetization targets power users, businesses, and institutions — never participation itself.

| Pillar | Timeline | Products | Target |
|--------|----------|----------|--------|
| **B2C Freemium** | Q3 2026 | "Hub Pro" — priority listings, verified badge, analytics | Community power users |
| **B2B Sponsorships** | Q2 2026 | "Adopt a Neighborhood" — branded skill challenges, reward pool | Local businesses |
| **B2B2G Institutional** | Q4 2026 | School/NGO skill certificates, Municipal skill registry API | Institutions |
| **AI Premium** | Q3 2026 | Advanced AI skill matching, smart scheduling, trend reports | Power users + orgs |
| **Micro-credentialing** | 2027 | LinkedIn verifiable skill certificates, printed impact certificates | Professionals |

### Revenue Trajectory
- 0 EUR (2026 Q1 — MVP launch)
- ~15,000 EUR (2026 Q4 — first B2B sponsorships)
- ~60,000 EUR ARR (2027 — institutional + AI premium)
- ~150,000+ EUR ARR (2028 — municipal API contracts + multi-city)

---

## 4. User Segments & Personas

### Segment 1: The Skill Sharer (Primary User)
**Profile:** 25–55, capable in a craft or profession, wants to contribute to community, smartphone-native

**Goals:** Offer skills to neighbors, build local reputation, get help in return

**Flows used:** Register → Create skill listing → Accept booking requests → Complete sessions

**Pain points resolved:**
- Finds interested neighbors via the Radar map (no cold outreach)
- Manages booking requests with clear accept/reject/cancel flow
- Controls availability with status toggles (available/busy/retired)

### Segment 2: The Help Seeker
**Profile:** 20–70, needs specific help (repair, tutoring, cooking, errands), trusts neighbor over stranger

**Goals:** Find someone nearby with the right skill, book a session, get help quickly

**Flows used:** Browse Radar → Find skill → Request session → Communicate format (online/in-person)

**Pain points resolved:**
- Neighborhood-scoped discovery — no scrolling through irrelevant results
- Clear availability hours and status before requesting
- Meeting format options (online/offline/hybrid) built into the request

### Segment 3: The Admin (Trust & Safety)
**Profile:** Platform operator, 1–3 people, trusted moderator

**Goals:** Verify listings, manage users, maintain platform integrity

**Flows used:** Admin panel → Manage users + skills → Review audit log → Handle reports

**Permissions enforced:**
- Cannot modify own role
- All admin actions logged immutably to `audit_log`
- Soft delete with GDPR anonymization (not hard delete)

### Segment 4: Anonymous Visitor
**Access:** Read-only. Can browse skills and radar map. Cannot request or interact.

**Business rationale:** SEO discoverability + low friction for prospective users to evaluate before registering.

### Permissions Matrix

| Feature | Anonymous | User | Admin |
|---------|-----------|------|-------|
| Browse skills + map | ✓ | ✓ | ✓ |
| Register / Login | ✓ | — | — |
| Create skill listing | ✗ | ✓ (verified email) | ✓ |
| Send skill request | ✗ | ✓ | ✓ |
| Manage own requests | ✗ | ✓ | ✓ |
| Edit own profile | ✗ | ✓ | ✓ |
| AI chat assistant | ✗ | ✓ | ✓ |
| View all users | ✗ | ✗ | ✓ |
| Delete any skill/user | ✗ | ✗ | ✓ |
| View audit log | ✗ | ✗ | ✓ |
| Admin panel | ✗ | ✗ | ✓ |

---

## 5. Core User Journeys

### Journey 1: New User Activation
```
1. Landing page (Radar map visible, read-only)
2. Click "Register" → email + password form
3. bcrypt(cost=12) password hash
4. users row created (email_verified_at = NULL)
5. Verification token generated (64-char hex, 24h TTL)
6. Resend sends verification email with link
7. User clicks link → API validates token → email_verified_at = now()
8. User can now create skill listings
```
**Failure states handled:**
- Invalid email format → zod validation error
- Email already registered → 409 Conflict
- Weak password → client-side strength check
- Expired token → 410 Expired, resend flow offered

### Journey 2: Skill Creation (Core Supply Loop)
```
1. Authenticated user with verified email
2. Fill: title (≥3 chars), description, category, available hours (0-168)
3. Optional: select neighborhood location from radar map
4. Optional: upload skill photo (JPEG/PNG/WebP, max 5MB → Cloudflare R2)
5. Submit → zod validation → INSERT skills
6. Skill appears on Radar map as marker
7. Available for other users to browse and request
```
**Failure states handled:**
- Unverified email → 403 UNVERIFIED_EMAIL
- Title < 3 chars → validation error
- Available hours > 168 → validation error (168 = 24×7)
- Photo wrong format → client-side MIME check before upload

### Journey 3: Skill Request (Core Demand Loop)
```
1. User finds skill on Radar map or /skills list
2. Views skill detail page (/skills/[id])
3. Fills request form: date, time range, meeting format (in_person/online/hybrid)
4. If online/hybrid: must provide meeting_url
5. Adds optional notes
6. Submit → INSERT skill_requests (status = 'pending')
7. Notification created for skill owner: "New request from [name]"
8. Owner reviews in /requests, accepts or rejects
```
**Failure states handled:**
- scheduled_end ≤ scheduled_start → 400 validation error
- User requesting their own skill → 400 SELF_REQUEST_NOT_ALLOWED
- Meeting URL missing for online/hybrid → validation error

### Journey 4: Request Lifecycle (State Machine)
```
pending
  ├── owner accepts → accepted
  │     ├── requester confirms → completed
  │     └── anyone cancels (+ reason) → cancelled
  ├── owner rejects → rejected
  └── requester cancels → cancelled
```
**Rules enforced at API level:**
- `pending → accepted/rejected`: only `user_to_id` (skill owner)
- `pending → cancelled`: only `user_from_id` (requester)
- `accepted → completed`: only `user_from_id` (confirms service received)
- `accepted → cancelled`: both parties, `cancellation_reason` required
- Invalid transitions → `400 INVALID_STATUS_TRANSITION`
- Notification created on every transition

### Journey 5: Neighborhood Radar (Discovery)
```
1. User (authenticated or not) visits /
2. GET /api/locations/list fetches neighborhood centroids
3. Map renders skill markers by category
4. User filters by type (skill, tool, event, food)
5. Click marker → skill detail popup
6. Click "View full listing" → /skills/[id]
7. From skill detail → "Request session"
```
**GDPR note:** Only neighborhood-level centroids are stored and displayed — no exact user addresses.

### Journey 6: Admin Workflow
```
1. Admin logs in → role check: users.role = 'admin'
2. /admin panel loads:
   - User management (list, soft-delete, change role)
   - Skill listings management
   - Skill requests overview
   - Audit log viewer
3. All admin actions auto-logged to audit_log:
   - user_id, action, entity, entity_id, metadata (before/after), ip_address
4. Soft delete: deleted_at set, email/profile anonymized (GDPR)
```

### Journey 7: AI Chat Assistant
```
1. Authenticated user opens AI chat (/api/ai/chat)
2. First message → auto-generate conversation title
3. Message sent with conversation context
4. AI responds with skill recommendations or help
5. Full history persisted in ai_conversations + ai_messages
6. User can delete conversation (GDPR right to erasure)
```
**Constraints:** Rate-limited to 20 requests/hour/user. Sensitive DB fields never included in AI context.

---

## 6. Feature Breakdown

### Feature 1: Skill Listings (CRUD)
**Description:** Users publish, browse, and manage skill offerings with category, availability, and location.

**User value:** Structured discovery of neighbor skills — no social media noise.

**Technical implementation:**
- Drizzle ORM → Neon PostgreSQL
- Soft delete (`deleted_at`) — never hard DELETE
- Status machine: `available` | `busy` | `retired`
- Image upload to Cloudflare R2 (MIME-validated, random filename, presigned URLs)
- Category normalized to `categories` table (no free-text categories)
- Location stored as neighborhood centroid in `locations` table (GDPR)

### Feature 2: Skill Requests & Booking
**Description:** Full request lifecycle — pending, accepted, rejected, completed, cancelled — with scheduling and meeting format.

**User value:** Structured time-slot booking, not ad-hoc messaging.

**Technical implementation:**
- 5-state status machine enforced at API level
- `scheduled_start/end` timestamps with CHECK(end > start)
- `meeting_type` CHECK: in_person | online | hybrid
- Conditional constraint: `meeting_url IS NOT NULL` when type is online/hybrid
- Ownership checks on all mutations
- Notifications triggered on every status change

### Feature 3: Neighborhood Radar Map
**Description:** Interactive map displaying skill/tool/event/food markers by neighborhood, filterable by type.

**User value:** Spatial discovery — find help near you visually, not just via list.

**Technical implementation:**
- Leaflet.js + OpenStreetMap (no API key, zero cost)
- Neighborhood-level centroids only (`locations.lat/lng`) — GDPR compliant
- GET `/api/locations/list` — public endpoint, no auth required
- Markers grouped by category with custom icons
- Mobile-responsive (react-native-maps for Expo)

### Feature 4: JWT Authentication & Authorization
**Description:** Custom JWT middleware with access + refresh token rotation, account lockout, email verification.

**User value:** Secure, persistent sessions across web and mobile.

**Technical implementation:**
- bcrypt cost=12 for password hashing
- Access token: 15-minute TTL
- Refresh token: 7-day TTL, stored in DB, httpOnly cookie (web) / secure storage (mobile)
- Token rotation: old token revoked (`is_revoked=true`) on every refresh
- Email verification: soft block — can login but not create listings
- Account lockout: 5 failed attempts → locked for 15 minutes

### Feature 5: AI Chat Assistant
**Description:** Conversational AI assistant for skill discovery, recommendations, and community help.

**User value:** Natural language interface for finding skills and scheduling.

**Technical implementation:**
- Anthropic API (claude-sonnet-4-6)
- Persistent conversation history in `ai_conversations` + `ai_messages`
- System prompt with explicit boundaries and privacy constraints
- Rate-limited: 20 req/hour/user (Upstash Redis)
- Sensitive fields (`password_hash`, `ip_address`) never in AI context
- User can delete conversations (GDPR Article 17)

### Feature 6: Admin Panel
**Description:** Role-gated dashboard for platform operations — user management, listing moderation, audit log.

**User value (admin):** Single place for all trust and safety operations.

**Technical implementation:**
- Role check: `users.role = 'admin'` enforced at API + middleware level
- Soft delete with GDPR anonymization sequence
- Immutable audit log (`audit_log` table) for all admin actions
- Admin panel route: `/admin` (server-side role guard)

### Feature 7: Notifications
**Description:** In-app notification system for request lifecycle events.

**User value:** Real-time awareness of request status without polling.

**Technical implementation:**
- Notification created on every request status change (API-level)
- Types: `new_request`, `request_accepted`, `request_rejected`, `request_cancelled`, `request_completed`
- `entity_type` column for future extensibility (tools, events, food)
- Mark read: individual (`PATCH /api/notifications/[id]/read`) or bulk
- Partial index: `(user_id, is_read) WHERE is_read = false` for fast unread count

### Feature 8: GDPR Compliance
**Description:** Full compliance with GDPR Articles 17 (erasure) and 20 (portability).

**User value:** Users can delete their account or export their data.

**Technical implementation:**
- Soft delete: `users.deleted_at` + anonymize email + profile (never hard DELETE)
- AI conversations: `deleted_at` on `ai_conversations` for user-initiated deletion
- `user_consents` table: tracks terms, marketing, analytics, ai_data consent
- `audit_log` retained for 2 years (legitimate interest), then cleaned
- GDPR-compliant locations: neighborhood centroids only, no exact addresses

---

## 7. System Architecture

### Overview
```
┌─────────────────────────────────────────────────────────┐
│                      Client Layer                        │
│                                                          │
│   Next.js Web App (React + Tailwind)  Expo Mobile App   │
└──────────────────────┬──────────────────────────────────┘
                       │ RESTful API (JSON over HTTPS)
┌──────────────────────▼──────────────────────────────────┐
│              Next.js Backend (App Router)                │
│         JWT Middleware + Zod Validation + Rate Limit     │
└──────────────────────┬──────────────────────────────────┘
           ┌───────────┴──────────────┐
           ▼                          ▼
┌─────────────────────┐    ┌──────────────────────────┐
│  Neon PostgreSQL    │    │      Cloudflare R2        │
│  (Drizzle ORM)      │    │  (Photo + File Storage)   │
│  neon-http driver   │    │  (Presigned URLs)         │
└─────────────────────┘    └──────────────────────────┘
           ▲                          
           │ Email                    
┌──────────┴──────────┐    ┌──────────────────────────┐
│  Resend             │    │  Upstash Redis            │
│  (Verification +    │    │  (@upstash/ratelimit)     │
│   Notifications)    │    │  (Rate Limiting)          │
└─────────────────────┘    └──────────────────────────┘
```

### Monorepo Structure
```
neighborhood-hub/
├── packages/
│   ├── nextjs/                    # Backend API + Web frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── api/           # REST API routes
│   │   │   │   │   ├── auth/      # register, login, logout, refresh
│   │   │   │   │   ├── skills/    # CRUD skill listings
│   │   │   │   │   ├── requests/  # skill request lifecycle
│   │   │   │   │   ├── locations/ # geo/radar data
│   │   │   │   │   ├── notifications/ # in-app notifications
│   │   │   │   │   └── ai/        # AI chat + recommendations
│   │   │   │   ├── (web)/         # Web pages (SSR/SSG)
│   │   │   │   └── admin/         # Admin panel (role-gated)
│   │   │   ├── components/        # Shared React components
│   │   │   ├── db/
│   │   │   │   ├── schema.ts      # Drizzle ORM schema (12 tables)
│   │   │   │   ├── index.ts       # DB connection (neon-http)
│   │   │   │   └── migrations/    # SQL migration files (committed to git)
│   │   │   └── lib/
│   │   │       ├── auth.ts        # JWT middleware
│   │   │       └── db.ts          # DB helpers
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   └── expo/                      # React Native mobile app
│       ├── src/
│       │   ├── screens/           # Mobile screens
│       │   ├── components/        # RN components
│       │   └── api/               # API client
│       └── package.json
├── AGENTS.md                      # AI agent instructions
├── CLAUDE.md                      # Claude Code context
├── ROADMAP.md                     # Product roadmap
├── README.md                      # Technical documentation
└── docs/
    └── PRODUCT_DOCUMENTATION.md   # This file
```

### Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Backend API | Next.js 16 (App Router) + TypeScript | API routes + server components |
| Web Frontend | React 19 + TypeScript + Tailwind CSS 4 | Mobile-first responsive |
| Mobile App | React Native + Expo | iOS/Android |
| Database | Neon PostgreSQL 17 + Drizzle ORM | Serverless, EU region |
| Auth | JWT (custom middleware) | bcrypt + refresh rotation |
| File Storage | Cloudflare R2 | S3-compatible, presigned URLs |
| Email | Resend | 3000/month free tier |
| Rate Limiting | Upstash Redis + @upstash/ratelimit | Netlify Edge compatible |
| AI | Anthropic API (claude-sonnet-4-6) | Chat + recommendations |
| Map | Leaflet.js + OpenStreetMap | No API key, free |
| Deployment | Netlify (web) + EAS Build (mobile) | Serverless |

### External Integrations

| Service | Purpose | Dependency Level |
|---------|---------|-----------------|
| Neon PostgreSQL | Data persistence | Critical |
| Cloudflare R2 | File storage | Optional for MVP |
| Resend | Email delivery | Required for email verification |
| Upstash Redis | Rate limiting | Required for production |
| Anthropic API | AI chat | Required for AI features |
| OpenStreetMap | Map tiles | Degraded UX without |
| Netlify | Web hosting + CDN | Deployment only |

---

## 8. Database Schema

### Tables Overview (12 tables)

```
users ──────────────────── 1:1 ──→ profiles
users ──────────────────── 1:N ──→ refresh_tokens
users ──────────────────── 1:N ──→ user_consents
users ──────────────────── 1:N ──→ audit_log (SET NULL on delete)
users ──────────────────── 1:N ──→ skills (owner_id)
users ──────────────────── 1:N ──→ skill_requests (user_from_id + user_to_id)
users ──────────────────── 1:N ──→ notifications
users ──────────────────── 1:N ──→ ai_conversations
categories ─────────────── 1:N ──→ skills
locations ──────────────── 1:N ──→ skills
locations ──────────────── 1:N ──→ profiles
skills ─────────────────── 1:N ──→ skill_requests (RESTRICT delete)
skill_requests ─────────── 1:N ──→ notifications (entity_id)
ai_conversations ───────── 1:N ──→ ai_messages
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `pgEnum` only for stable binary fields | `ALTER TYPE` cannot run in transactions in Neon — risk for migrations |
| `VARCHAR + CHECK` for all status fields | Easy to add new states via migration |
| `neon-http` driver for all queries | Works on Netlify Edge; HTTP pipeline transactions for atomicity |
| Client-side UUID generation | ID available before INSERT — useful for response body construction |
| Soft delete on users + skills | GDPR compliance + preserve history |
| Neighborhood centroids only in `locations` | GDPR Article 5 — no exact user addresses |
| Separate `users` and `profiles` tables | Auth concerns isolated from profile concerns |
| Cursor-based pagination | No OFFSET — consistent performance as data grows |

### Critical Constraints
- `skill_requests`: `user_from_id != user_to_id` (no self-requests)
- `skill_requests`: `scheduled_end > scheduled_start`
- `skill_requests`: `meeting_url IS NOT NULL` when `meeting_type IN ('online', 'hybrid')`
- `skills`: `available_hours BETWEEN 0 AND 168`
- `skills`: `char_length(title) >= 3`
- `locations`: `UNIQUE(city, neighborhood, type)` — no duplicate radar markers
- `refresh_tokens`: `expires_at > created_at`
- `user_consents`: `UNIQUE(user_id, consent_type, version)`

---

## 9. API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register + send verification email |
| POST | `/api/auth/login` | — | Login, return JWT access + refresh tokens |
| POST | `/api/auth/logout` | JWT | Logout, revoke refresh token |
| POST | `/api/auth/refresh` | Cookie | Refresh access token, rotate refresh token |
| GET | `/api/skills/list` | — | List all skills (paginated, cursor-based) |
| POST | `/api/skills/create` | JWT | Create skill (requires verified email) |
| GET | `/api/skills/[id]` | — | Get skill details |
| PATCH | `/api/skills/[id]` | JWT | Update skill (owner only) |
| DELETE | `/api/skills/[id]` | JWT | Soft-delete skill (owner only) |
| POST | `/api/requests/create` | JWT | Send skill booking request |
| GET | `/api/requests/list` | JWT | List my sent/received requests |
| GET | `/api/requests/[id]` | JWT | Get request details |
| PATCH | `/api/requests/[id]` | JWT | Update request status (state machine) |
| GET | `/api/locations/list` | — | Get radar map markers |
| GET | `/api/notifications/list` | JWT | List my notifications (paginated) |
| PATCH | `/api/notifications/[id]/read` | JWT | Mark notification as read |
| POST | `/api/ai/chat` | JWT | Send AI chat message |
| GET | `/api/ai/conversations` | JWT | List AI conversation history |

### Response Format
```json
// Success
{ "data": { ... } }

// Error
{ "error": "HUMAN_READABLE_CODE", "message": "Details..." }
```

### Common Error Codes
- `400 INVALID_STATUS_TRANSITION` — invalid request status change
- `400 SELF_REQUEST_NOT_ALLOWED` — user requesting their own skill
- `401 UNAUTHORIZED` — missing or invalid JWT
- `403 UNVERIFIED_EMAIL` — skill creation without verified email
- `403 FORBIDDEN` — ownership check failed
- `404 NOT_FOUND` — resource not found
- `409 CONFLICT` — duplicate resource (e.g., email already exists)
- `429 RATE_LIMITED` — too many requests

---

## 10. Security Model

### Authentication
- **Password:** bcrypt, cost factor 12. Never MD5/SHA1/SHA256.
- **Access token TTL:** 15 minutes
- **Refresh token TTL:** 7 days
- **Token storage:** `httpOnly` cookie (web), secure storage (mobile)
- **Refresh rotation:** Old token revoked on every `/api/auth/refresh`
- **Account lockout:** 5 failed attempts → 15 minutes lockout

### Rate Limiting (Upstash Redis)

| Endpoint | Limit |
|----------|-------|
| `POST /api/auth/login` | 5 req / 15 min / IP |
| `POST /api/auth/register` | 3 req / hour / IP |
| `POST /api/ai/chat` | 20 req / hour / user |
| All other routes | 100 req / min / user |

### Authorization
- All mutations require ownership check: `WHERE id = $1 AND owner_id = $userId`
- Admin panel guarded at middleware + API level
- Never expose: `password_hash`, `refresh_tokens`, `ip_address` in responses or AI context

### HTTP Security Headers (next.config.ts)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` (script/resource control)

### CORS
- Explicit allowed origins only
- Never `Access-Control-Allow-Origin: *` on authenticated endpoints

### File Uploads
- Server-side MIME type validation (not by extension)
- Random filename generated, original discarded
- Max 5MB. Allowed: `image/jpeg`, `image/png`, `image/webp`
- Served via presigned Cloudflare R2 URLs only

---

## 11. Non-Functional Requirements

### Performance
| Concern | Implementation |
|---------|---------------|
| DB queries | Cursor-based pagination (no OFFSET) |
| Radar map | Neighborhood centroids (not per-user locations) |
| Notifications | Partial index on `(user_id, is_read) WHERE is_read=false` |
| File delivery | Cloudflare R2 CDN + presigned URLs |
| Rate limiting | Edge-compatible Upstash Redis |

### Reliability
| Pattern | Implementation |
|---------|---------------|
| Soft deletes | users + skills — no permanent data loss |
| Audit trail | `audit_log` for all admin actions |
| Token integrity | `refresh_tokens` with `is_revoked` flag |
| Input validation | Zod on every API route before DB |

### Scalability
| Component | Current State | Bottleneck |
|-----------|--------------|------------|
| Skill list | Cursor-paginated | None — scales linearly |
| Radar markers | All active loaded | Degrades at ~500 skills |
| Notifications | Latest N per user | None — truncated query |
| DB connections | Neon serverless | Managed by Neon pooling |

### Observability (Planned)
- Error tracking: Sentry (free tier)
- Uptime monitoring: UptimeRobot (free)
- Analytics: Plausible (privacy-compliant, EU-hosted)

---

## 12. Trade-offs & Product Decisions

### What Was Optimized For

| Priority | Decision | Evidence |
|----------|----------|---------|
| Security by default | JWT + ownership checks on every mutation | auth.ts middleware + API-level checks |
| GDPR from day one | Neighborhood centroids only, soft delete, consent tracking | locations table design, user_consents |
| Fast iteration | VARCHAR + CHECK over pgEnum | Easier status field migrations |
| Zero infrastructure waste | Neon serverless + Netlify (no always-on servers) | No idle compute cost |
| Mobile-first | React Native + Expo from the start | packages/expo |

### What Was Deliberately Simplified

| Simplification | Rationale |
|----------------|-----------|
| No ratings/reviews in MVP | Separate UX flow with edge cases — out of scope |
| No real-time updates | Polling acceptable for MVP; WebSockets add complexity |
| No exact user coordinates | GDPR principle of data minimization |
| Email verification as soft block | Lower friction for adoption; hard block has high abandonment |
| Single currency (time) | No points economy in v0.1 — keeps the model simple |
| No search in v0.1 | Radar map + category filter sufficient at launch scale |

### Key Constraints Visible in Code

| Constraint | Impact |
|------------|--------|
| Neon-http no native transactions | Pipeline transactions for atomicity |
| pgEnum cannot change in Neon transactions | VARCHAR + CHECK for all evolving status fields |
| Netlify serverless (no persistent connections) | Neon serverless driver required |
| No exact coordinates stored | Radar shows neighborhood-level, not exact addresses |

---

## 13. Product Roadmap

### MVP — v0.1 (Active, 4 weeks)

| Week | Focus | Key Deliverables |
|------|-------|-----------------|
| 1 | Foundation | Auth + DB schema + Monorepo setup + Deploy skeleton |
| 2 | Core Supply | Skill Listings CRUD (API + Web) |
| 3 | Core Demand | Skill Requests + Neighborhood Radar + Admin panel |
| 4 | Mobile + Polish | 3+ Mobile screens + README + 15+ commits |

### v0.2 — Tool Library
- Lending tools and household items (drill, ladder, lawnmower)
- Availability status: free / reserved / borrowed
- Date/time reservations with confirmation notifications
- **New tables:** `tools`, `tool_reservations`

### v0.3 — Neighborhood Events
- Community events + charitable initiatives
- Event RSVPs with capacity limits
- **New tables:** `events`, `event_attendees`
- **Note:** Charity is `event_type: 'charity'` — not a separate module

### v0.4 — Food Sharing
- Share surplus food (homegrown, seasonal produce)
- Status: available / reserved / picked_up
- **New tables:** `food_shares`, `food_reservations`

### v0.5 — Social Feed / Chat
- Neighborhood activity feed
- Direct messaging or group chats by neighborhood

### Post-MVP Growth (Q2–Q4 2026)

| Quarter | Focus |
|---------|-------|
| Q2 2026 | AI features (skill matching, smart scheduling) |
| Q3 2026 | Tool Library + Events (v0.2–v0.3) |
| Q4 2026 | B2B sponsorships + institutional partnerships |
| Q1 2027 | Multi-city expansion |

---

## 14. Design Audit

*Conducted: April 2026 | Scope: MVP UI/UX review*
*Methodology: Heuristic evaluation + mobile-first audit at 375px / 768px / 1280px*

### 14.1 Visual Identity

**What to optimize for:**
- Neighborhood warmth and trust — not corporate coldness
- Clear visual language for skill categories (color or icon system)
- Mobile-first — most users will access via phone during/after work

**Recommendations:**

| Issue | Impact | Recommendation |
|-------|--------|---------------|
| No established color system | High | Define 5 CSS custom properties: `--color-primary`, `--color-accent`, `--color-surface`, `--color-success`, `--color-danger` |
| No category icon system | Medium | Assign an icon per skill category (tools, cooking, tutoring, repairs, etc.) — FontAwesome or Heroicons |
| Typography hierarchy undefined | Medium | 3-level scale: heading (700), label (500), body (400); min 15px base |

**Brand alignment target:** Warm, community-focused, mobile-optimized.

### 14.2 Information Architecture

**Proposed navigation (5 items):**
```
Home (Radar) | Skills | My Requests | Profile | Admin (role-gated)
```

**Key recommendations:**

1. **Radar map is the home screen** — not a separate page. It is the primary discovery tool and differentiator. Make it the default `/` route with a skill list panel alongside.

2. **Skills list + map should be the same page** — two views (list / map toggle), not two routes. Users should switch between them without losing filters.

3. **My Requests deserves a dedicated nav item** — this is the core loop for active users. Don't bury it in the profile dropdown.

4. **Mobile bottom navigation** — 5-tab bottom bar on mobile: Home | Skills | + (Create) | Requests | Profile. The center `+` button is the primary action.

### 14.3 Gamification UX (Time-banking)

Unlike points-based platforms, Neighborhood Hub uses **time as currency** — the natural incentive of community reciprocity.

**What to surface:**

| Element | Current | Recommendation |
|---------|---------|---------------|
| Skills offered | Hidden in list | Show count prominently on profile: "12 skills shared" |
| Completed sessions | Not tracked in UI | "8 sessions completed" badge on profile |
| Community activity | Not visible | "23 skills available in Лозенец" on radar |
| Skill request feedback | Status only | After completion: optional 1-line thank-you note |

**Top 3 gamification improvements:**

1. **Profile completion indicator** — "Your profile is 60% complete. Add a skill to reach 80%." Drives supply-side onboarding.

2. **Neighborhood leaderboard** — "Top skill sharers in Студентски Град this month." Simple SELECT with count(*) of completed requests per user.

3. **Session completion acknowledgment** — When requester marks `completed`, show a thank-you animation and prompt: "Leave a note for [name]?" (optional 140-char text, stored on the request). No ratings — just human acknowledgment.

### 14.4 Mobile-First Gaps

**Tested at: 375px (iPhone SE), 390px (iPhone 14), 768px (iPad)**

| Breakpoint | Gap | Fix |
|------------|-----|-----|
| 375px | Skill cards need minimum tap target (44px) | Set `min-height: 44px` on interactive elements |
| 390px | Request form date/time pickers must be native | Use `<input type="datetime-local">` — iOS/Android native pickers |
| All | Map occupies full screen with no skill panel | Slide-up bottom sheet over map showing nearby skills |
| All | Admin panel tables unreadable on mobile | Card-based layout on mobile, table on desktop (CSS only) |

**Bottom navigation bar (all mobile):**
```
[🏠 Home] [🔍 Skills] [＋ Create] [📋 Requests] [👤 Profile]
```
The `+` center button is the primary action — create a new skill listing.

### 14.5 Page-by-Page Recommendations

| Page | Layout Priority | Key Improvement |
|------|----------------|-----------------|
| `/` (Radar) | Map full-screen + bottom sheet with skill list | Filter chips above map: category + neighborhood |
| `/skills` | Grid on desktop, list on mobile | Sticky filter bar persisted in sessionStorage |
| `/skills/[id]` | Hero image + details + request form | Sticky "Request session" CTA on mobile |
| `/requests` | Tabs: Sent / Received / Completed | Status badge color-coded (pending=yellow, accepted=green, rejected=red) |
| `/profile` | Avatar + stats bar + skills list | "X sessions completed · Y skills listed" stats above fold |
| `/admin` | Sidebar nav on desktop, tabs on mobile | Unread request count badge on nav items |

### 14.6 Design System Foundation

**CSS Custom Properties (define before writing a single component):**
```css
--color-primary:    #2d6a8f;  /* trust blue — interactive elements */
--color-accent:     #52b788;  /* community green — positive states */
--color-surface:    #f8faf9;  /* page/card backgrounds */
--color-warning:    #f4a261;  /* pending states */
--color-danger:     #e63946;  /* errors, rejections */

--text-heading: clamp(1.25rem, 2.5vw, 1.75rem);
--text-body:    0.9375rem;   /* 15px */
--text-label:   0.8125rem;   /* 13px */

--space-base: 1rem;    /* component padding */
--space-gap:  1.5rem;  /* between components */
```

**Top 5 highest-ROI design changes:**
1. Bottom navigation on mobile — ~2h CSS — eliminates primary UX friction
2. Map + skill list combined on home screen — ~1 day — core discovery improvement
3. Skill category icon system — ~0.5 days — instant visual clarity on radar
4. Request status color badges — ~1h — reduces cognitive load in /requests
5. Profile stats bar ("8 sessions completed") — ~0.5 days — motivates supply-side participation

---

*Last updated: 2026-04-02. Document maintained alongside ROADMAP.md and AGENTS.md.*
