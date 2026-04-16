# Neighborhood Hub

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-green)
![Neon](https://img.shields.io/badge/Neon-PostgreSQL-brightgreen?logo=postgresql)
![Expo](https://img.shields.io/badge/Expo-54-000000?logo=expo)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2-f6821f?logo=cloudflare)

A multi-platform full-stack app for Bulgarian neighborhoods — skill sharing, time swapping, and community connection.

- **Live demo:** [neighborhood-hub.netlify.app](https://neighborhood-hub.netlify.app)
- **Course:** Full Stack Apps with AI – SoftUni
- **Type:** Capstone project (Phase 1 — active)

---

## What It Does

Neighbors can:
- **Share skills** — offer and request help (repairs, cooking, tutoring, gardening, etc.)
- **Browse and filter listings** — by category, location, status, keyword search
- **Book skill sessions** — request with date, time and format (in-person / online / hybrid)
- **Manage requests** — accept, reject, complete, or cancel with real-time notifications
- **Chat with an AI assistant** — get help navigating the platform
- **Admin panel** — manage users, lock accounts, audit all actions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Next.js 15 (App Router) + TypeScript |
| Database | Neon PostgreSQL + Drizzle ORM |
| Auth | JWT (access + refresh tokens, custom middleware) |
| Web Frontend | React + TypeScript + Tailwind CSS 4 |
| Mobile | React Native + Expo 54 |
| AI | Anthropic claude-haiku-4-5 |
| Email | Resend |
| Rate Limiting | Upstash Redis + @upstash/ratelimit |
| Storage | Cloudflare R2 (photos/files) |
| Deployment | Netlify (serverless) |

---

## Project Structure

```
neighborhood-hub/
├── packages/
│   ├── nextjs/                  # Backend API + Web frontend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── api/         # REST API routes
│   │   │   │   │   ├── auth/    # register, login, logout, refresh, me, verify-email, resend-verification, forgot-password, reset-password
│   │   │   │   │   ├── skills/  # CRUD skill listings
│   │   │   │   │   ├── skill-requests/  # booking requests state machine
│   │   │   │   │   ├── notifications/   # in-app notifications
│   │   │   │   │   ├── profile/         # user profile
│   │   │   │   │   ├── tools/           # CRUD tool listings
│   │   │   │   │   ├── tool-reservations/ # reservation state machine
│   │   │   │   │   ├── admin/           # admin user management + audit log
│   │   │   │   │   └── ai/              # AI chat + conversation history
│   │   │   │   └── (web)/       # Web pages (React server components)
│   │   │   ├── components/      # Shared React components
│   │   │   ├── contexts/        # Auth context
│   │   │   ├── db/
│   │   │   │   ├── schema.ts    # Drizzle schema (all 14 tables)
│   │   │   │   └── migrations/  # SQL migration files
│   │   │   └── lib/
│   │   │       ├── auth.ts      # JWT sign/verify helpers
│   │   │       ├── middleware.ts # requireAuth / requireAdmin wrappers
│   │   │       ├── ratelimit.ts # Upstash rate limiters
│   │   │       ├── email.ts     # Resend email templates
│   │   │       ├── audit.ts     # Audit log writer
│   │   │       ├── api.ts       # Client fetch helper (auto Content-Type, token refresh)
│   │   │       ├── format.ts    # Shared date/status formatting utilities
│   │   │       ├── queries/     # Reusable DB query functions
│   │   │       └── schemas/     # Zod validation schemas
│   │   └── package.json
│   └── mobile/                  # React Native mobile app (Expo 54)
│       ├── app/
│       │   ├── (app)/           # Authenticated screens
│       │   └── (auth)/          # Login / Register screens
│       ├── components/          # Shared RN components (Skeleton, SkeletonCard, etc.)
│       ├── contexts/            # Auth context (mobile)
│       └── lib/                 # API client, token storage, format utils, toast
├── AGENTS.md                    # AI agent instructions + coding rules
└── README.md
```

---

## Database Schema

14 tables across 4 concern areas:

### Auth & Users
| Table | Purpose |
|-------|---------|
| `users` | Auth only (email, password_hash, role, lockout, soft delete) |
| `profiles` | Profile data (name, bio, avatar_url, location_id FK, is_public) |
| `refresh_tokens` | JWT refresh tokens with rotation + revocation |
| `user_consents` | GDPR consent tracking |
| `audit_log` | Admin action log with metadata jsonb |

### Skills & Requests
| Table | Purpose |
|-------|---------|
| `categories` | Normalized skill categories (slug UNIQUE, label) |
| `locations` | Neighborhood-level geo centroids (GDPR compliant) |
| `skills` | Skill listings (owner_id, title, category, status, soft delete) |
| `skill_requests` | Booking requests — full state machine |
| `notifications` | In-app notifications triggered by request status changes |

### Tool Library
| Table | Purpose |
|-------|---------|
| `tools` | Tool listings (owner_id, title, condition, category, location, status, soft delete) |
| `tool_reservations` | Borrow requests — pending → approved → returned/rejected/cancelled |

### AI Chat
| Table | Purpose |
|-------|---------|
| `ai_conversations` | Chat sessions (user_id, title, soft delete) |
| `ai_messages` | Individual messages (role: user/assistant, content) |

### Skill Request State Machine

```
pending ──[owner accepts]──→ accepted ──[requester confirms]──→ completed
   │                             │
   │                             └──[anyone cancels]──→ cancelled
   ├──[owner rejects]──→ rejected
   └──[requester cancels]──→ cancelled
```

### Tool Reservation State Machine

```
pending ──[owner approves]──→ approved ──[owner marks returned]──→ returned
   │                              │
   │                              └──[owner or borrower cancels]──→ cancelled
   └──[owner rejects]──→ rejected
   └──[borrower cancels]──→ cancelled
```

---

## API Reference

### Auth
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login → access token + refresh cookie |
| POST | `/api/auth/logout` | JWT | Revoke refresh token |
| POST | `/api/auth/refresh` | cookie | Rotate refresh token |
| GET | `/api/auth/me` | JWT | Get current user |
| POST | `/api/auth/verify-email` | — | Verify email with token |
| POST | `/api/auth/resend-verification` | JWT | Resend verification email |
| POST | `/api/auth/forgot-password` | — | Send password reset email |
| POST | `/api/auth/reset-password` | — | Set new password with token |

### Skills
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/skills` | — | List skills (search, filter, paginate) |
| POST | `/api/skills` | JWT + verified | Create skill listing |
| GET | `/api/skills/[id]` | — | Get skill detail |
| PUT | `/api/skills/[id]` | JWT + owner | Edit skill |
| DELETE | `/api/skills/[id]` | JWT + owner | Soft delete skill |
| PATCH | `/api/skills/[id]/status` | JWT + owner | Change skill status |

### Skill Requests
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/skill-requests` | JWT | List my requests (sent/received) |
| POST | `/api/skill-requests` | JWT + verified | Create request |
| PATCH | `/api/skill-requests/[id]` | JWT | Update status (state machine) |

### Tools
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/tools` | — | List tools (search, filter by category/location/status, paginate) |
| POST | `/api/tools` | JWT + verified | Create tool listing |
| GET | `/api/tools/[id]` | — | Get tool detail |
| PUT | `/api/tools/[id]` | JWT + owner | Edit tool (title, description, category, location, condition, status) |
| DELETE | `/api/tools/[id]` | JWT + owner | Soft delete tool |

### Tool Reservations
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/tool-reservations` | JWT | List my reservations (as borrower or owner) |
| POST | `/api/tool-reservations` | JWT + verified | Create reservation request |
| PATCH | `/api/tool-reservations/[id]` | JWT | Update status (approve/reject/return/cancel) |

### Profile, Notifications & Uploads
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/profile` | JWT | Get my profile |
| PUT | `/api/profile` | JWT | Update my profile (name, bio, avatar, location, visibility) |
| GET | `/api/notifications` | JWT | List my notifications |
| POST | `/api/notifications/read` | JWT | Mark notifications as read |
| POST | `/api/upload` | JWT | Upload image to Cloudflare R2 (JPEG/PNG/WebP, max 5 MB) |

### Admin
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/admin/users` | JWT + admin | List all users |
| PATCH | `/api/admin/users/[id]` | JWT + admin | Lock/unlock/promote/delete user |
| GET | `/api/admin/audit` | JWT + admin | Audit log |

### AI Chat
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/ai/chat` | JWT | Send message, get AI response |
| GET | `/api/ai/conversations` | JWT | List my conversations |
| GET | `/api/ai/conversations/[id]` | JWT | Load conversation messages |
| DELETE | `/api/ai/conversations/[id]` | JWT | Soft delete conversation |

---

## Web Screens

| Screen | Route |
|--------|-------|
| Home / Dashboard | `/` |
| Register | `/register` |
| Login | `/login` |
| Forgot Password | `/forgot-password` |
| Reset Password | `/reset-password` |
| Verify Email | `/verify-email` |
| Skill List + Search + Filters | `/skills` |
| Skill Detail + Request modal | `/skills/[id]` |
| Create Skill | `/skills/new` |
| Edit Skill | `/skills/[id]/edit` |
| My Requests | `/my-requests` |
| Profile View | `/profile` |
| Profile Edit | `/profile/edit` |
| Admin — Users | `/admin/users` |
| Admin — Audit Log | `/admin/audit` |
| AI Chat | `/chat` |
| Tool Library | `/tools` |
| Tool Detail + Reserve | `/tools/[id]` |
| Create Tool | `/tools/new` |
| Edit Tool | `/tools/[id]/edit` |
| My Reservations | `/my-reservations` |

## Mobile Screens (Expo 54)

| Screen | Route |
|--------|-------|
| Login | `/(auth)/login` |
| Register | `/(auth)/register` |
| Skill List (paginated) | `/(app)/(tabs)/index` |
| Skill Detail + Request | `/(app)/skills/[id]` |
| Create Skill | `/(app)/skills/new` |
| Edit Skill | `/(app)/skills/edit/[id]` |
| Request Skill | `/(app)/skills/request/[id]` |
| My Requests (sent/received) | `/(app)/(tabs)/my-requests` |
| My Skills | `/(app)/my-skills` |
| Notifications | `/(app)/(tabs)/notifications` |
| Profile + Avatar Upload | `/(app)/(tabs)/profile` |
| Edit Profile | `/(app)/profile/edit` |
| Public User Profile | `/(app)/users/[id]` |
| AI Chat | `/(app)/chat` |
| Neighborhood Radar | `/(app)/radar` |
| Tool Library | `/(app)/tools` |
| Tool Detail + Reserve | `/(app)/tools/[id]` |

---

## Security

- **Passwords:** bcrypt cost=12. Never MD5/SHA1/SHA256.
- **JWT:** access token 15 min, refresh token 7 days (httpOnly cookie on web, SecureStore on mobile)
- **Refresh token rotation:** old token revoked on every refresh
- **Account lockout:** 5 failed attempts → locked 15 minutes
- **Timing attack protection:** dummy bcrypt hash compared on unknown email
- **Rate limiting** (Upstash Redis):
  - `POST /api/auth/login` → 5 req / 15 min / IP
  - `POST /api/auth/register` → 3 req / hour / IP
  - `POST /api/ai/chat` → 20 req / hour / user
  - All other routes → 100 req / min / user
- **Input validation:** all request bodies validated with Zod
- **Ownership checks:** all mutations filter by `owner_id` / `user_id`
- **Soft delete:** `deleted_at` on `users` and `skills`
- **Audit log:** all admin actions logged with metadata
- **Security headers:** `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Content-Security-Policy`, `Strict-Transport-Security`
- **Concurrent request protection:** partial unique index on `skill_requests(skill_id, user_from_id)` where status is `pending` or `accepted` — prevents race condition duplicates at the DB level

---

## Local Development

### Prerequisites
- Node.js 22+
- A [Neon](https://neon.tech) PostgreSQL database
- An [Upstash](https://upstash.com) Redis instance
- A [Resend](https://resend.com) API key (for emails)
- An [Anthropic](https://console.anthropic.com) API key (for AI chat)
- A [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) bucket (for image uploads)

### Setup

```bash
# 1. Clone
git clone https://github.com/hristiyanstoilov/Neighborhood-Hub.git
cd Neighborhood-Hub

# 2. Install dependencies
npm install

# 3. Configure environment
cp packages/nextjs/.env.example packages/nextjs/.env.local
# Edit .env.local with your credentials

# 4. Run DB migrations
cd packages/nextjs && npx drizzle-kit migrate && cd ../..

# 5. (Optional) Seed categories, locations, demo users, skills/requests, and tools/reservations
cd packages/nextjs && npm run db:seed && cd ../..

# 6. Install mobile dependencies
cd packages/mobile && npm install --legacy-peer-deps && cd ../..

# 7. Start dev servers
npm run dev:web      # Next.js on http://localhost:3000
npm run dev:mobile   # Expo — scan QR with Expo Go app
```

### Environment Variables

```env
# Database (Neon)
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=...                  # min 32 chars, generate: openssl rand -base64 32

# Email (Resend)
RESEND_API_KEY=re_...
RESEND_FROM=noreply@yourdomain.com

# Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# AI (Anthropic)
ANTHROPIC_API_KEY=sk-ant-...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# File Storage (Cloudflare R2) — required for avatar and skill image uploads
CLOUDFLARE_R2_BUCKET=...
CLOUDFLARE_R2_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_KEY=...
CLOUDFLARE_R2_SECRET_KEY=...
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

---

## Deployment (Netlify)

1. Go to [netlify.com](https://netlify.com) → Add new site → Import from GitHub
2. Set **Base directory** to `packages/nextjs`
3. Set **Build command** to `npm run build`
4. Set **Publish directory** to `packages/nextjs/.next`
5. Add all environment variables from `.env.example`
6. Deploy

The `netlify.toml` at the repo root is pre-configured for the monorepo layout.

---

## DB Migrations

```bash
cd packages/nextjs

# After changing schema.ts:
npx drizzle-kit generate   # generates SQL migration file
npx drizzle-kit migrate    # applies to DB

# Never use drizzle-kit push in production
```

---

## Contributing

See [AGENTS.md](AGENTS.md) for architecture decisions, coding rules, and business logic.