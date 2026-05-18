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
- Date-overlap check: `lt(existing.startDate, newEnd) AND gt(existing.endDate, newStart)` — touching boundaries do NOT conflict (correct half-open interval).
- `react-native-maps` `pinColor` tints default pin on iOS only — Android ignores hex; use custom `<View>` child inside `<Marker>` for cross-platform colors.
- Email sends: await the DB lookup for recipient email, then fire-and-forget only the `send()` call — consistent with food reservation pattern.
- `expire-stale` must cover all 3 reservation types: skillRequests (30d), toolReservations (14d), foodReservations (7d) — food was the easy miss.
- AI chat: persist user message first, then on Anthropic failure do `db.delete(aiMessages).where(eq(id, persistedMsg.id))` — prevents duplicate context on retry.
- DM endpoints: POST conversations + POST messages need `requireVerifiedAuthWithRateLimit` — unverified accounts are a spam vector for DMs.
- Register `ageConfirmed`: `z.literal(true, { message: '...' })` — `errorMap` key doesn't exist in this Zod version, use `message` directly.
- Conversation blocked-user filter: query `userBlocks` once with `inArray` on all `otherUserIds`, build a `Set`, then `Array.filter` — avoids N `isBlocked` calls.
- AI chat rate-limited routes: use `requireVerifiedAuth` (not `requireVerifiedAuthWithRateLimit`) when the route manages its own limiter (`aiRatelimit`) to avoid double rate-limiting.
- Expire-stale skill requests: use `request_cancelled`, not `request_rejected` — timeout ≠ active owner decline.
- Reservation expiry notifications: notify both borrower AND owner — both parties need to know the pending slot freed up.
- Gamification points: only award on NEW RSVP (`isNewRsvp = !existing`), not re-attending after cancel — prevents double-earn.
- Admin unpublish: use `z.discriminatedUnion('action', [...])` when PATCH has two distinct payloads — avoids leaking status field into unpublish branch.
- `messages` table uses `body` column, not `content` — always check schema before writing to message fields.
- Push notifications: `sendPushNotification()` in `lib/push.ts` calls Expo API directly — no SDK needed, just `fetch`. Silent DB catch was a bug, not intentional.
- Search unified view: merge per-type arrays client-side after `Promise.all(jobs)`, sort by `rank` DESC — rank values from ts_rank are comparable across types.
- `innerJoin` is NOT a named export from `drizzle-orm` — use `.innerJoin()` method chain on the query builder instead.
- Token refresh (`/api/auth/refresh`) must check `lockedUntil` — login blocks banned users but refresh does not unless explicitly added.
- Expire-stale skill requests: use `status: 'cancelled'`, not `status: 'rejected'` — timeout ≠ active owner decline (rejected = owner action).
- Badge criteria must count completed transactions, not listings — `good_neighbor` uses `foodReservations WHERE status='picked_up'`, not `foodShares` count.
- `data-retention` must clean up parent rows after child deletion — delete orphaned `aiConversations` (0 messages) with `notExists()` subquery after `aiMessages` bulk delete.
- Every route handler body needs its own try/catch — `requireAuth`/`requireVerifiedAuth` outer catch only wraps token verification, not the handler.
- `requireAdmin` must check `lockedUntil` — it chains into `requireAuth` (JWT only), not `requireVerifiedAuth`, so banned admins bypass the lock check.
- `syncFoodShareStatus`: check `pickedUpCount >= quantity` FIRST, then `(activeCount + pickedUpCount) >= quantity` for `reserved` — mixing picked_up + active counts otherwise falls through to `available`.
- State machine updates that award points need a CAS WHERE guard (`AND status = 'expected_status'`) — without it, concurrent calls both pass the read-time check and award points twice.
- Every gamification trigger (pledge, rating, RSVP, food pickup, tool return, skill complete) needs `checkAndAwardBadges` — missing the call means the badge is never awarded for that user action.
- Admin unpublish switch: set `updatedAt: now` on ALL target types — skill case was missing it, all other cases (tool, food, event, drive) had it.
- Mobile `auth.tsx` `register()`: pass `ageConfirmed` as a parameter — never hardcode `true`; the server requires `z.literal(true)`, UI checkbox must drive the value.
- CAS guard on state machine approve/complete: add `AND status = 'pending'` to WHERE clause — prevents double notification + double email on concurrent approve calls.
- AI chat history: use `orderBy(desc).limit(N).reverse()` — `orderBy(asc).limit(N)` fetches the OLDEST N messages, not the newest; long conversations lose all recent context.
- Feed actor filter: always join `users WHERE deletedAt IS NULL` alongside `profiles WHERE isPublic = true` — soft-deleted users' feed events remain visible without the users join.
- N+1 in GET routes: collapse sequential conditional queries into a `Promise.all` with a LEFT JOIN — profile location is the canonical example.
