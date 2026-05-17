# Neighborhood Hub – Claude Context

All project instructions, tech stack, coding rules, architecture, and business logic are in **AGENTS.md**.

## Rule #1
Do not make any changes until you have 95% confidence in what you need to build. Ask follow-up questions until you reach that confidence.

## UI Modularity Rule
Step 7 applies: split UI into modular React components and feature folders. Keep these refactors structure-only unless behavior changes are explicitly requested.

## Build Commands
```bash
npm run dev:web                          # Start Next.js dev server
npm run dev:mobile                       # Start Expo dev server
cd packages/nextjs && npx drizzle-kit generate  # Generate DB migration
cd packages/nextjs && npm run db:migrate        # Run migrations (scripts/migrate.ts — drizzle-kit migrate hangs with Neon)
npm run build:web                        # Build web app
```

## Applied Learning
When something fails repeatedly or a workaround is found, add a one-line bullet. Keep under 15 words. Only things that save time in future sessions.

- Neon MCP requires `start <API_KEY>` as args, not env variable.
- Use `@filename` to point Claude at specific files instead of letting it explore freely.
- `apiFetch` must skip `Content-Type` header for `FormData` bodies — fetch sets multipart boundary automatically.
- `drizzle-orm/neon-http` does not support `db.transaction`; use sequential writes + compensation.
- Mobile `npm install` requires `--legacy-peer-deps` due to react-native peer constraints.
- Never hardcode `'image/jpeg'` for mobile image picker — use `asset.mimeType` from expo-image-picker.
- Never pre-seed `drizzle.__drizzle_migrations` without running SQL — causes invisible schema drift.
- Bulk seed: use only terminal statuses (completed/rejected/returned/cancelled) — partial unique indexes reject intra-batch active duplicates.
- `vitest.integration.config.ts` runs before vitest loads `.env.local` — add `dotenv.config({ path: '.env.local' })` at the top.
- `refresh_tokens_expiry_check` requires `expires_at > created_at` — test expired tokens need explicit past `createdAt`.
- Food reservation approval: use atomic WHERE-clause subquery + post-commit compensating rollback — not `db.transaction` (neon-http).
- Bidirectional block check: `or(and(eq(blockerId,A), eq(blockedId,B)), and(eq(blockerId,B), eq(blockedId,A)))` — extract to `lib/queries/blocks.ts`, not inline.
- All admin destructive routes need `apiRatelimit.limit(user.sub)` — `requireAdmin` middleware alone adds no rate limit.
- Fire-and-forget catches: `.catch((e) => console.error('[side-effect]', e))`, never `.catch(() => {})` — silent swallows hide real notification/email failures.
