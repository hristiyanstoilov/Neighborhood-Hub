# Feature B — Ratings & Reviews: Technical Implementation Plan

## Overview

After a skill exchange, tool return, or food pickup is complete, both participants can leave each other a 1–5 star rating with an optional comment. Ratings are shown on public profiles and used to build neighborhood trust.

---

## 1. Database Schema

### 1.1 New table: `ratings`

Add to `packages/nextjs/src/db/schema.ts`:

```typescript
export const ratings = pgTable(
  'ratings',
  {
    id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    raterId:     uuid('rater_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    ratedUserId: uuid('rated_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    // context links the rating to the completed transaction
    contextType: varchar('context_type', { length: 30 }).notNull(),
    contextId:   uuid('context_id').notNull(),
    score:       integer('score').notNull(),            // 1–5
    comment:     text('comment'),                       // optional, max 500 chars
    createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    // one rating per rater per completed transaction
    uniqueIndex('ratings_rater_context_idx').on(t.raterId, t.contextType, t.contextId),
    index('ratings_rated_user_idx').on(t.ratedUserId),
    index('ratings_context_idx').on(t.contextType, t.contextId),
    check('ratings_score_check', sql`${t.score} BETWEEN 1 AND 5`),
    check('ratings_context_type_check', sql`${t.contextType} IN ('skill_request', 'tool_reservation', 'food_reservation')`),
  ]
)
```

### 1.2 Denormalize rating summary on profiles

Add two columns to the `profiles` table migration:

```sql
ALTER TABLE profiles
  ADD COLUMN avg_rating  NUMERIC(3,2),
  ADD COLUMN rating_count INTEGER NOT NULL DEFAULT 0;
```

In Drizzle schema (`profiles` table):
```typescript
avgRating:   numeric('avg_rating', { precision: 3, scale: 2 }),
ratingCount: integer('rating_count').default(0).notNull(),
```

These are updated by a helper called from the rating creation API route (no triggers — Neon HTTP transport doesn't support triggers reliably).

### 1.3 Migration files

```bash
cd packages/nextjs
npx drizzle-kit generate   # creates migration SQL
npx drizzle-kit migrate    # applies to Neon
```

Commit the generated SQL file in `src/db/migrations/`.

---

## 2. API Routes

### 2.1 `POST /api/ratings` — create a rating

File: `packages/nextjs/src/app/api/ratings/route.ts`

**Auth:** requireAuth — must be logged in.

**Request body (zod):**
```typescript
const CreateRatingSchema = z.object({
  contextType: z.enum(['skill_request', 'tool_reservation', 'food_reservation']),
  contextId:   z.string().uuid(),
  ratedUserId: z.string().uuid(),
  score:       z.number().int().min(1).max(5),
  comment:     z.string().max(500).optional(),
})
```

**Logic:**
1. Validate body with zod.
2. Verify the context record exists and is in a terminal state:
   - `skill_request` → `status = 'completed'`
   - `tool_reservation` → `status = 'returned'`
   - `food_reservation` → `status = 'picked_up'`
3. Verify the `rater_id` (viewer) is a participant in the context:
   - skill_request: `user_from_id` or `user_to_id`
   - tool_reservation: `borrower_id` or `owner_id`
   - food_reservation: `requester_id` or `owner_id`
4. Verify `ratedUserId` is the *other* participant (not the rater).
5. Insert into `ratings` (will fail with 409 if duplicate due to unique index).
6. Recalculate avg_rating and rating_count for `ratedUserId`:
   ```typescript
   const [agg] = await db
     .select({
       avg: sql<string>`AVG(score)`,
       count: sql<number>`COUNT(*)`,
     })
     .from(ratings)
     .where(eq(ratings.ratedUserId, body.ratedUserId))
   await db.update(profiles)
     .set({ avgRating: agg.avg, ratingCount: agg.count })
     .where(eq(profiles.userId, body.ratedUserId))
   ```
7. Return `{ data: rating }`.

**Error codes:**
- `CONTEXT_NOT_FOUND` — 404
- `NOT_A_PARTICIPANT` — 403
- `CONTEXT_NOT_TERMINAL` — 409 (with message "This exchange is not yet complete")
- `DUPLICATE_RATING` — 409 (unique constraint)

### 2.2 `GET /api/ratings?userId=<uuid>&limit=20&offset=0` — list ratings for a user

File: `packages/nextjs/src/app/api/ratings/route.ts` (GET handler in same file)

**Auth:** public (no auth required).

**Logic:**
1. Parse `userId` from query params — required.
2. Query `ratings` joined with `profiles` (rater's name + avatar):
   ```typescript
   db.select({
     id: ratings.id,
     score: ratings.score,
     comment: ratings.comment,
     contextType: ratings.contextType,
     createdAt: ratings.createdAt,
     raterName: profiles.name,
     raterAvatarUrl: profiles.avatarUrl,
   })
   .from(ratings)
   .innerJoin(profiles, eq(profiles.userId, ratings.raterId))
   .where(eq(ratings.ratedUserId, userId))
   .orderBy(desc(ratings.createdAt))
   .limit(limit)
   .offset(offset)
   ```
3. Return `{ data: { ratings, total } }`.

### 2.3 `GET /api/ratings/check?contextType=&contextId=` — has viewer already rated?

File: `packages/nextjs/src/app/api/ratings/check/route.ts`

**Auth:** requireAuth.

Returns `{ data: { hasRated: boolean, existingRating: RatingRow | null } }`.

Used by the UI to hide/show the rating form.

---

## 3. Web Screens

### 3.1 Rating form component

File: `packages/nextjs/src/components/ui/rating-form.tsx`

Props:
```typescript
interface RatingFormProps {
  contextType: 'skill_request' | 'tool_reservation' | 'food_reservation'
  contextId: string
  ratedUserId: string
  ratedUserName: string
  onSuccess?: () => void
}
```

UI:
- 5 star buttons (click to select, hover to preview)
- Optional text area (max 500 chars)
- Submit button — calls `POST /api/ratings`
- On success: show toast "Rating submitted!", hide the form
- Use `useMutation` from TanStack Query; on success `invalidateQueries` for the public profile key

### 3.2 Add rating prompt to completed contexts

**Skill request detail / My Requests page:**

File: `packages/nextjs/src/app/(web)/my-requests/request-card.tsx`

When `status === 'completed'`:
- Check `/api/ratings/check?contextType=skill_request&contextId=<id>` via `useQuery`
- If `hasRated === false`: render `<RatingForm contextType="skill_request" contextId={req.id} ratedUserId={...} />`
- If `hasRated === true`: render a small "You rated X ★" badge

**Tool reservation card:**

File: `packages/nextjs/src/app/(web)/my-reservations/reservation-card.tsx`

Same pattern for `status === 'returned'`.

**Food reservation card:**

File: `packages/nextjs/src/app/(web)/food/reservations/page.tsx` (or reservation-card component)

Same pattern for `status === 'picked_up'`.

### 3.3 Show ratings on public profile

File: `packages/nextjs/src/app/(web)/users/[id]/_components/public-profile-header.tsx`

- Display `avgRating` and `ratingCount` from the profile query (already fetched):
  ```tsx
  {profile.ratingCount > 0 && (
    <span>★ {Number(profile.avgRating).toFixed(1)} ({profile.ratingCount} reviews)</span>
  )}
  ```

File: `packages/nextjs/src/app/(web)/users/[id]/page.tsx` (or a new `_components/public-profile-ratings.tsx`)

- Add a "Reviews" section below skills
- Fetch from `GET /api/ratings?userId=<id>` using `useQuery`
- Render a list of `RatingCard` items showing score stars, comment, rater name, date
- Paginate with "Load more" button

---

## 4. Mobile Screens

### 4.1 Rating form modal

File: `packages/mobile/app/(app)/_components/RatingModal.tsx`

- Full-screen modal with star row + text input + submit
- Props: `contextType`, `contextId`, `ratedUserId`, `ratedUserName`, `visible`, `onClose`
- Calls `PATCH /api/ratings` via `apiFetch`
- Shows toast on success via `useToast()`

### 4.2 Trigger from completed request/reservation cards

In `packages/mobile/app/(app)/(tabs)/my-requests.tsx`:
- When a request card has `status === 'completed'` and `hasRated === false`, show "Rate [name]" button
- Tap opens `<RatingModal />`

Same pattern in:
- `packages/mobile/app/(app)/tools/my-reservations.tsx` (status: returned)
- `packages/mobile/app/(app)/food/reservations.tsx` (status: picked_up)

### 4.3 Rating display on public profile

File: `packages/mobile/app/(app)/users/[id].tsx`

- Below skills section: average stars + count header
- FlatList of recent reviews (limit 5, "See all" navigates to a full ratings screen)

---

## 5. TanStack Query Keys

Add to `packages/nextjs/src/lib/query-keys.ts`:

```typescript
ratings: {
  all: ['ratings'] as const,
  byUser: (userId: string) => ['ratings', 'user', userId] as const,
  check: (contextType: string, contextId: string) =>
    ['ratings', 'check', contextType, contextId] as const,
}
```

---

## 6. Seed Data

Add to `packages/nextjs/src/db/seed.ts` — new `seedRatings()` function:

- Seed 3-4 ratings on completed skill_requests and returned tool_reservations
- One rating from each side of each completed exchange
- Vary scores (3, 4, 5) and include 1-2 with comments

Call `seedRatings()` after `seedDrives()` in the main `seed()` flow.

---

## 7. Execution Order

1. Schema + migration (`ratings` table + `avg_rating`/`rating_count` columns on `profiles`)
2. API: `POST /api/ratings`, `GET /api/ratings`, `GET /api/ratings/check`
3. Web: `RatingForm` component + integrate into `request-card.tsx`, `reservation-card.tsx`
4. Web: Public profile ratings section
5. Mobile: `RatingModal` + wire into completed-state cards + public profile
6. Seed data
7. Code review + QA

---

## 8. Validation Checklist

- [ ] Only participants in a completed context can rate
- [ ] Each rater can rate each context at most once (unique constraint)
- [ ] Non-terminal contexts return 409
- [ ] `avg_rating` on profile updates correctly after each new rating
- [ ] Public profile shows correct star display with 0-rating fallback
- [ ] Rating form hides after submission
- [ ] Mobile toast fires on successful rating
- [ ] `npm run build:web` passes
- [ ] `npm run typecheck:mobile` passes
