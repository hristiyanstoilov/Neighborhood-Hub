# Neighborhood Hub

A multi-platform full-stack app for Bulgarian neighborhoods that enables skill sharing, time swapping, tool lending, food sharing, and community events.

**Live demo:** _coming soon_
**Demo credentials:** `demo@neighborhood.hub` / `demo123`

---

## What It Does

Neighbors can:
- **Share skills** – offer and request help (repairs, cooking, tutoring, gardening)
- **Browse the Neighborhood Radar** – interactive map showing what's available nearby
- **Book time slots** – request a skill session with date, time and format (online/offline)
- **Admins** can manage users, listings and requests via the admin panel

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client Apps                       │
│                                                     │
│   Next.js Web App          Expo Mobile App          │
│   (React + Tailwind)       (React Native)           │
└──────────────┬──────────────────────┬───────────────┘
               │    RESTful API       │
               ▼                      ▼
┌─────────────────────────────────────────────────────┐
│              Next.js Backend API                    │
│         (API Routes + JWT Auth)                     │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌──────────────────┐    ┌──────────────────────┐
│  Neon PostgreSQL  │    │   Cloudflare R2      │
│  (Drizzle ORM)   │    │   (File Storage)     │
└──────────────────┘    └──────────────────────┘
```

### Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Backend API | Next.js App Router | REST endpoints + server logic |
| Web Frontend | React + TypeScript + Tailwind | Browser client |
| Mobile App | React Native + Expo | iOS/Android client |
| Database | Neon PostgreSQL + Drizzle ORM | Data storage |
| Auth | JWT (custom middleware) | Authentication + authorization |
| File Storage | Cloudflare R2 | Photo uploads |
| Deployment | Netlify (serverless) | Hosting |

---

## Database Schema

### Tables

#### `users` – Auth data only
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| email | varchar(255) | UNIQUE, NOT NULL |
| password_hash | text | NOT NULL |
| role | 'user' \| 'admin' | default 'user' |
| email_verified_at | timestamptz | NULL until verified |
| failed_login_attempts | int | default 0 |
| locked_until | timestamptz | NULL = not locked |
| deleted_at | timestamptz | soft delete |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

#### `profiles` – User profile data (separated from auth)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users UNIQUE, CASCADE |
| name | varchar(100) | CHECK length >= 2 |
| bio | text | |
| avatar_url | varchar(2048) | |
| city | varchar(100) | |
| neighborhood | varchar(100) | |
| location_id | uuid | FK → locations SET NULL |
| is_public | bool | default true |
| updated_at | timestamptz | default now() |

#### `refresh_tokens` – JWT refresh token storage
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users CASCADE |
| token | text | UNIQUE, NOT NULL |
| is_revoked | bool | default false |
| user_agent | text | |
| ip_address | inet | |
| expires_at | timestamptz | NOT NULL |
| created_at | timestamptz | default now() |

#### `audit_log` – Admin action log
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users SET NULL |
| user_email | varchar(255) | snapshot at action time |
| action | varchar(100) | CHECK IN ('create','update','delete','login','logout',...) |
| entity | varchar(100) | CHECK IN ('user','skill','skill_request',...) |
| entity_id | uuid | |
| metadata | jsonb | before/after state |
| ip_address | inet | |
| created_at | timestamptz | default now() |

#### `categories` – Normalized skill categories
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| slug | varchar(100) | UNIQUE (e.g. 'repairs', 'cooking') |
| label | varchar(200) | display name |
| created_at | timestamptz | default now() |

#### `user_consents` – GDPR consent tracking
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users CASCADE |
| consent_type | varchar(100) | e.g. 'terms', 'marketing', 'analytics' |
| granted | bool | NOT NULL |
| granted_at | timestamptz | |
| revoked_at | timestamptz | |
| ip_address | inet | |
| version | varchar(20) | policy version e.g. '2025-01' |

#### `skills` – Skill listings
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| owner_id | uuid | FK → users CASCADE |
| title | varchar(200) | CHECK length >= 3 |
| description | text | |
| category_id | uuid | FK → categories |
| available_hours | int | CHECK 0–168 |
| status | 'available' \| 'busy' \| 'retired' | default 'available' |
| location_id | uuid | FK → locations SET NULL |
| deleted_at | timestamptz | soft delete |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

#### `skill_requests` – Skill booking requests
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_from_id | uuid | FK → users CASCADE |
| user_to_id | uuid | FK → users CASCADE |
| skill_id | uuid | FK → skills RESTRICT |
| scheduled_start | timestamptz | NOT NULL |
| scheduled_end | timestamptz | NOT NULL |
| meeting_type | 'in_person' \| 'online' \| 'hybrid' | |
| meeting_url | varchar(2048) | nullable, for online/hybrid |
| status | 'pending' \| 'accepted' \| 'rejected' \| 'completed' | default 'pending' |
| notes | text | |
| cancellation_reason | text | |
| cancelled_by_id | uuid | FK → users SET NULL |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

CHECK: `user_from_id != user_to_id`, `scheduled_end > scheduled_start`

#### `locations` – Neighborhood-level geo data (radar map)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| city | varchar(100) | NOT NULL |
| neighborhood | varchar(100) | NOT NULL |
| lat | numeric(9,6) | neighborhood centroid (public data, GDPR OK) |
| lng | numeric(9,6) | neighborhood centroid (public data, GDPR OK) |
| country_code | char(2) | default 'BG' |
| type | 'skill_location' \| 'event_location' \| 'thing_location' | |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

> `lat`/`lng` are neighborhood-level centroids (public geo data), not exact user addresses – GDPR compliant

#### `notifications` – In-app notifications
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users CASCADE |
| type | varchar(100) | 'request_accepted', 'request_rejected', 'new_request', 'request_cancelled' |
| entity_id | uuid | related skill_request id |
| is_read | bool | default false |
| created_at | timestamptz | default now() |

#### `ai_conversations` – AI chat sessions
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → users CASCADE |
| title | varchar(200) | auto-generated from first message |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

#### `ai_messages` – AI chat messages
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| conversation_id | uuid | FK → ai_conversations CASCADE |
| role | 'user' \| 'assistant' | |
| content | text | NOT NULL |
| created_at | timestamptz | default now() |

### Relationships

```
users ──< profiles              (1:1)
users ──< refresh_tokens        (1:many)
users ──< user_consents         (1:many)
users ──< audit_log             (1:many, SET NULL on delete)
users ──< skills                (1:many, owner_id)
users ──< skill_requests        (1:many, user_from_id + user_to_id)
users ──< notifications         (1:many)
users ──< ai_conversations      (1:many)
categories ──< skills           (1:many, category_id)
locations ──< skills            (1:many, location_id)
locations ──< profiles          (1:many, location_id)
skills ──< skill_requests       (1:many, RESTRICT delete)
skill_requests ──< notifications (1:many, entity_id)
ai_conversations ──< ai_messages (1:many)
```

### Indexes

| Index | Table | Columns | Type | Notes |
|-------|-------|---------|------|-------|
| skills_owner_id | skills | owner_id | btree | |
| skills_status | skills | status | btree | partial: WHERE deleted_at IS NULL |
| skills_category_id | skills | category_id | btree | |
| skill_requests_user_from | skill_requests | user_from_id | btree | |
| skill_requests_user_to | skill_requests | user_to_id | btree | |
| skill_requests_status | skill_requests | status | btree | |
| skill_requests_composite | skill_requests | (user_from_id, status) | btree | for "my requests" queries |
| notifications_user_id | notifications | user_id | btree | |
| notifications_unread | notifications | (user_id, is_read) | btree | partial: WHERE is_read = false |
| ai_conversations_user_id | ai_conversations | user_id | btree | |
| ai_messages_conversation_id | ai_messages | conversation_id | btree | |
| refresh_tokens_user_id | refresh_tokens | user_id | btree | |
| refresh_tokens_token | refresh_tokens | token | btree | UNIQUE |
| audit_log_user_id | audit_log | user_id | btree | |
| audit_log_created_at | audit_log | created_at | btree | for time-range queries |
| categories_slug | categories | slug | btree | UNIQUE |
| locations_city_neighborhood | locations | (city, neighborhood) | btree | for radar queries |
| locations_lat_lng | locations | (lat, lng) | btree | for geo proximity queries |

### DB Roles (Neon)

| Role | Rights | Used by |
|------|--------|---------|
| `neon_admin` | DDL + DML (everything) | Drizzle migrations only |
| `app_user` | SELECT, INSERT, UPDATE, DELETE (no DDL) | Next.js API runtime |
| `readonly` | SELECT (excluding password_hash, refresh_tokens) | Debug, analytics |

### Key DB Rules

- **Never** `drizzle-kit push` in production – use `drizzle-kit generate` + `drizzle-kit migrate`
- Every migration has `.up.sql` + `.down.sql` for rollback
- Soft delete – `deleted_at` timestamp instead of hard DELETE on `users` and `skills`
- GDPR delete – anonymize email + profile data, never physical delete
- `audit_log` is kept but cleaned after 2 years (legitimate interest)
- `refresh_tokens` with expired `expires_at` cleaned up periodically
- `lat`/`lng` in `locations` are neighborhood centroids only – no exact user addresses (GDPR)
- `category` is normalized in `categories` table – not free text
- Use `@neondatabase/serverless` + `drizzle-orm/neon-http` (not node-postgres)
- Neon region: `aws-eu-central-1` (EU data on EU servers)
- Cursor-based pagination instead of OFFSET
- Row Level Security (RLS) policies on all tables
- VARCHAR instead of pgEnum for status fields where possible (easier migrations)

---

## Project Structure

```
neighborhood-hub/
├── packages/
│   ├── nextjs/                   # Backend API + Web app
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── api/          # REST API endpoints
│   │   │   │   │   ├── auth/     # register, login, logout
│   │   │   │   │   ├── skills/   # CRUD for skills
│   │   │   │   │   ├── requests/ # skill requests
│   │   │   │   │   ├── locations/# geo data
│   │   │   │   │   ├── notifications/ # user notifications
│   │   │   │   │   └── ai/       # AI chat + recommendations
│   │   │   │   ├── (web)/        # Web pages
│   │   │   │   └── admin/        # Admin panel
│   │   │   ├── components/       # React components
│   │   │   ├── db/
│   │   │   │   ├── schema.ts     # Drizzle schema
│   │   │   │   └── migrations/   # SQL migration files
│   │   │   └── lib/
│   │   │       ├── auth.ts       # JWT middleware
│   │   │       └── db.ts         # DB connection
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   └── expo/                     # Mobile app
│       ├── src/
│       │   ├── screens/          # App screens
│       │   ├── components/       # RN components
│       │   └── api/              # API client
│       └── package.json
├── AGENTS.md                     # AI agent instructions
├── ROADMAP.md                    # Product roadmap
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | – | Register new user |
| POST | `/api/auth/login` | – | Login, returns JWT |
| POST | `/api/auth/logout` | JWT | Logout |
| GET | `/api/skills/list` | – | List all skills |
| POST | `/api/skills/create` | JWT | Create skill listing |
| GET | `/api/skills/[id]` | – | Get skill details |
| POST | `/api/requests/create` | JWT | Send skill request |
| GET | `/api/requests/list` | JWT | List my requests |
| PATCH | `/api/requests/[id]` | JWT | Update request status |
| GET | `/api/locations/list` | – | Get radar map data |
| GET | `/api/notifications/list` | JWT | List my notifications |
| PATCH | `/api/notifications/[id]/read` | JWT | Mark notification as read |
| POST | `/api/ai/chat` | JWT | AI chat assistant |
| GET | `/api/ai/conversations` | JWT | List AI conversations |

---

## Security

### Authentication
- **Passwords:** bcrypt, cost factor 12
- **Access token TTL:** 15 minutes
- **Refresh token TTL:** 7 days, stored in `httpOnly` cookie (web) / secure storage (mobile)
- **Refresh token rotation:** old token revoked on every refresh
- **Account lockout:** 5 failed attempts → locked for 15 minutes

### Rate Limiting
Uses `@upstash/ratelimit` + Upstash Redis:

| Endpoint | Limit |
|----------|-------|
| `POST /api/auth/login` | 5 req / 15 min / IP |
| `POST /api/auth/register` | 3 req / hour / IP |
| `POST /api/ai/chat` | 20 req / hour / user |
| All other routes | 100 req / min / user |

### Input Validation
- All request bodies validated with **zod** before DB operations
- Ownership checks on all mutations (`owner_id` / `user_id` filter)

### File Uploads
- MIME type validated server-side (not by extension)
- Random filename generated, original discarded
- Max 5MB, allowed types: `image/jpeg`, `image/png`, `image/webp`
- Served via presigned Cloudflare R2 URLs only

### HTTP Security Headers
Configured in `next.config.ts`: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy`

---

## Local Development Setup

### Prerequisites

- Node.js 18+
- npm 9+
- A [Neon](https://neon.tech) PostgreSQL database
- A [Cloudflare R2](https://developers.cloudflare.com/r2/) bucket (optional)

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/neighborhood-hub.git
cd neighborhood-hub
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp packages/nextjs/.env.example packages/nextjs/.env.local
```

Fill in your values:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key-min-256-bit
JWT_REFRESH_SECRET=your-refresh-secret-min-256-bit
RESEND_API_KEY=your-resend-api-key
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
CLOUDFLARE_R2_BUCKET=...
CLOUDFLARE_R2_ACCESS_KEY=...
CLOUDFLARE_R2_SECRET_KEY=...
CLOUDFLARE_R2_PUBLIC_URL=...
```

### 4. Run database migrations

```bash
cd packages/nextjs
npx drizzle-kit migrate
```

### 5. Start development servers

```bash
# Web app (Next.js)
cd packages/nextjs
npm run dev

# Mobile app (Expo)
cd packages/expo
npx expo start
```

Web app runs at `http://localhost:3000`

---

## Deployment

- **Web app:** Netlify (connected to GitHub, auto-deploy on push to `main`)
- **Database:** Neon serverless PostgreSQL (region: `aws-eu-central-1`)
- **Mobile:** Expo Go (development) / EAS Build (production)

---

## Web App Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Register | `/register` | Create account |
| Login | `/login` | Sign in |
| Neighborhood Radar | `/` | Map with skill/event markers |
| Skill List | `/skills` | Browse all skills |
| Skill Detail | `/skills/[id]` | View skill + request form |
| My Requests | `/requests` | Track sent/received requests |
| Profile | `/profile` | Edit profile |
| Admin Panel | `/admin` | Manage users and content |

## Mobile Screens

| Screen | Description |
|--------|-------------|
| Login / Register | Auth flow |
| Skill List | Browse skills |
| Skill Detail + Request | View and book a skill |
