# Contributing to Neighborhood Hub

## Prerequisites

- Node.js 18+
- npm 9+
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)
- Git

## Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/hristiyanstoilov/Neighborhood-Hub.git
cd Neighborhood-Hub

# 2. Install all dependencies (monorepo)
npm install

# 3. Set up environment variables
cp packages/nextjs/.env.example packages/nextjs/.env.local
# Fill in your DATABASE_URL, JWT_SECRET, etc.

# 4. Run database migrations
cd packages/nextjs
npx drizzle-kit migrate

# 5. Start the dev server
npm run dev
```

Web app runs at `http://localhost:3000`.

## Project Structure

```
packages/
  nextjs/    — Next.js backend API + web frontend
  expo/      — React Native mobile app (coming soon)
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
