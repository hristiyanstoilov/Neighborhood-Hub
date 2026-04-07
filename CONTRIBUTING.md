# Contributing to Neighborhood Hub

## Prerequisites

- Node.js 20+
- npm 10+
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)
- A [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) bucket (for image uploads)
- Git

## Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/hristiyanstoilov/Neighborhood-Hub.git
cd Neighborhood-Hub

# 2. Install web dependencies
npm install

# 3. Install mobile dependencies (requires --legacy-peer-deps due to RN peer constraints)
cd packages/mobile && npm install --legacy-peer-deps && cd ../..

# 4. Set up environment variables
cp packages/nextjs/.env.example packages/nextjs/.env.local
# Fill in DATABASE_URL, JWT_SECRET, UPSTASH_*, RESEND_*, CLOUDFLARE_R2_*, etc.

# 5. Run database migrations
cd packages/nextjs && npx drizzle-kit migrate && cd ../..

# 6. (Optional) Seed locations + categories
cd packages/nextjs && npx tsx src/db/seed.ts && cd ../..

# 7. Start dev servers
npm run dev:web      # Next.js on http://localhost:3000
npm run dev:mobile   # Expo — scan QR with Expo Go app
```

Web app runs at `http://localhost:3000`.

## Project Structure

```
packages/
  nextjs/    — Next.js backend API + web frontend
  mobile/    — React Native mobile app (Expo 54)
docs/        — Product documentation and roadmap
```

## Development Workflow

- Branch from `master` for new features
- One feature per commit — keep commits focused
- Follow the commit naming convention: `type: short description`
  - `feat:` new feature
  - `fix:` bug fix
  - `docs:` documentation only
  - `chore:` tooling, config, cleanup

## Database Changes

Never modify the database directly. Always use Drizzle migrations:

```bash
cd packages/nextjs

# After editing src/db/schema.ts:
npx drizzle-kit generate   # generates SQL migration file
npx drizzle-kit migrate    # applies to database

# Commit the generated migration file
git add src/db/migrations/
```

## Code Rules

- TypeScript strict mode — no `any`
- Tailwind only — no inline styles
- Zod validation on every API route input
- Always check ownership on mutations (`owner_id = userId`)
- No `console.log` in production code

Full coding rules are in [AGENTS.md](AGENTS.md).
