# Feature C — Search & Discovery Upgrades: Technical Implementation Plan

## Overview

Currently each module (Skills, Tools, Events, Drives, Food) has its own isolated list with basic `ILIKE` search. This feature adds a unified cross-module full-text search endpoint, Postgres GIN indexes for performance, a global search UI in the nav bar, and a `/search` results page with per-module tabs.

---

## 1. Database Changes

### 1.1 Full-text search columns

Add a generated `tsvector` column to each searchable table. These are stored columns updated automatically by Postgres on every insert/update — no application-layer sync needed.

Run migrations for each table:

**skills:**
```sql
ALTER TABLE skills
  ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
    ) STORED;

CREATE INDEX skills_search_idx ON skills USING GIN (search_vector);
```

**tools:**
```sql
ALTER TABLE tools
  ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
    ) STORED;

CREATE INDEX tools_search_idx ON tools USING GIN (search_vector);
```

**events:**
```sql
ALTER TABLE events
  ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
    ) STORED;

CREATE INDEX events_search_idx ON events USING GIN (search_vector);
```

**community_drives:**
```sql
ALTER TABLE community_drives
  ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english',
        coalesce(title, '') || ' ' ||
        coalesce(description, '') || ' ' ||
        coalesce(goal_description, '')
      )
    ) STORED;

CREATE INDEX community_drives_search_idx ON community_drives USING GIN (search_vector);
```

**food_shares:**
```sql
ALTER TABLE food_shares
  ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
      to_tsvector('simple',
        coalesce(title, '') || ' ' || coalesce(description, '')
      )
    ) STORED;

CREATE INDEX food_shares_search_idx ON food_shares USING GIN (search_vector);
```

> Note: Use `'simple'` dictionary for food_shares because titles are in Bulgarian — `'english'` stemming would mangle them.

### 1.2 Drizzle schema additions

In `packages/nextjs/src/db/schema.ts`, add `searchVector` column to each table (read-only, not set by application):

```typescript
// inside skills table:
searchVector: text('search_vector'),  // Drizzle can't model GENERATED tsvector — treat as opaque

// Same for tools, events, communityDrives, foodShares
```

Actually, since Drizzle doesn't model `GENERATED ALWAYS AS` for tsvector, write the search query using raw `sql` tag rather than the column definition. The migration SQL above is sufficient — no Drizzle schema change needed.

### 1.3 Migration files

Create four migration SQL files (one per run of `drizzle-kit generate` or write manually):

```bash
cd packages/nextjs
npx drizzle-kit generate  # after adding raw SQL migrations
npx drizzle-kit migrate
```

For generated columns not supported by Drizzle's generator, write the migration SQL files manually and place them in `src/db/migrations/` with sequential filenames (`0025_search_indexes.sql`, etc.).

---

## 2. API Routes

### 2.1 `GET /api/search` — unified cross-module search

File: `packages/nextjs/src/app/api/search/route.ts`

**Auth:** public (no auth required for search results).

**Query params:**
```
q          string    required, min 2 chars
types      string    optional, comma-separated: "skills,tools,events,drives,food" (default: all)
locationId string    optional, filter by neighborhood
limit      number    optional, default 5 per module (max 20)
```

**Logic:**
1. Parse and validate params with zod.
2. Sanitize `q` → `plainto_tsquery` (handles user typos, strips operators):
   ```typescript
   const tsQuery = sql`plainto_tsquery('english', ${q})`
   const tsQuerySimple = sql`plainto_tsquery('simple', ${q})`
   ```
3. Run parallel queries for each requested type:

```typescript
// Skills query
const skillsQuery = db.select({
  id: skills.id,
  type: sql<string>`'skill'`,
  title: skills.title,
  description: skills.description,
  status: skills.status,
  ownerId: skills.ownerId,
  ownerName: profiles.name,
  locationId: skills.locationId,
  neighborhood: locations.neighborhood,
  rank: sql<number>`ts_rank(to_tsvector('english', coalesce(${skills.title},'') || ' ' || coalesce(${skills.description},'')), plainto_tsquery('english', ${q}))`,
})
.from(skills)
.innerJoin(profiles, eq(profiles.userId, skills.ownerId))
.leftJoin(locations, eq(locations.id, skills.locationId))
.where(and(
  sql`to_tsvector('english', coalesce(${skills.title},'') || ' ' || coalesce(${skills.description},'')) @@ plainto_tsquery('english', ${q})`,
  isNull(skills.deletedAt),
  locationId ? eq(skills.locationId, locationId) : undefined,
))
.orderBy(sql`rank DESC`)
.limit(limit)
```

Repeat for tools, events (filter `deletedAt IS NULL`, `status != 'cancelled'`), drives, food shares.

4. Return combined response:
```typescript
{
  data: {
    skills:  SkillSearchResult[],
    tools:   ToolSearchResult[],
    events:  EventSearchResult[],
    drives:  DriveSearchResult[],
    food:    FoodSearchResult[],
    query:   string,
    totalByType: { skills: n, tools: n, events: n, drives: n, food: n },
  }
}
```

### 2.2 Rate limiting

Apply existing Upstash rate limiter: 30 requests / minute per IP (unauthenticated users share IP bucket). Authenticated users get 60/min using `user.id`.

---

## 3. Web Screens

### 3.1 Global search bar in nav

File: `packages/nextjs/src/components/nav.tsx`

**Changes:**
- Add a search input between the logo and the user menu
- On desktop: `<input>` always visible, width ~220px
- On mobile: collapsed icon that expands to full-width overlay
- On submit (Enter key or 300ms debounce after typing stops): `router.push('/search?q=' + encodeURIComponent(value))`
- Show no results inline — navigation handles display

Implementation detail:
- Use a controlled `<input>` with `useState`
- `useRouter` from `next/navigation` for programmatic navigation
- Do NOT fire API calls from the nav input — let the `/search` page handle the query

### 3.2 Search results page

File: `packages/nextjs/src/app/(web)/search/page.tsx`

This is a **Server Component** that reads `searchParams.q` and `searchParams.type`.

```typescript
export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; locationId?: string }
}) {
  const q = searchParams.q ?? ''
  // fetch server-side for SEO + fast initial render
  const results = q.length >= 2
    ? await fetchSearch({ q, types: searchParams.type, locationId: searchParams.locationId })
    : null

  return <SearchResultsView results={results} query={q} />
}
```

File: `packages/nextjs/src/app/(web)/search/_components/search-results-view.tsx` (client component)

- Tab bar: All | Skills | Tools | Events | Drives | Food — each tab shows count badge
- Active tab shows the corresponding result list
- Each result card is a compact version of the module's existing card component
- "No results" empty state with suggestion to broaden search
- Search input pre-filled with current `q`, submits with Enter
- `useSearchParams` + `useRouter` for tab switching without full reload

File: `packages/nextjs/src/app/(web)/search/_components/search-result-card.tsx`

Unified card rendering per type — each branch renders an appropriate layout:
- Skill: title, owner name, category badge, status badge, location
- Tool: title, owner name, condition badge, status badge
- Event: title, date, location, capacity
- Drive: title, type badge, deadline, status
- Food: title, quantity, available-until, status

### 3.3 Location filter (neighborhood selector)

File: `packages/nextjs/src/app/(web)/search/_components/location-filter.tsx`

- `<select>` populated from `GET /api/locations` (already exists)
- Changing selection appends `locationId=` to URL params
- Clears to "All neighborhoods" option

### 3.4 TanStack Query key

Add to `packages/nextjs/src/lib/query-keys.ts`:

```typescript
search: {
  all: ['search'] as const,
  results: (q: string, types?: string, locationId?: string) =>
    ['search', 'results', q, types ?? 'all', locationId ?? 'all'] as const,
}
```

Use this key if adding a client-side search hook for real-time results.

---

## 4. Mobile Screens

### 4.1 Global search screen

File: `packages/mobile/app/(app)/search/index.tsx`

- Full-screen search UI: text input at top, results below
- Debounce 400ms then call `GET /api/search?q=...`
- Tab switcher (ScrollView horizontal): All / Skills / Tools / Events / Drives / Food
- `FlatList` per active tab of compact result cards
- "Nothing found" empty state with magnifying glass icon

### 4.2 Navigation entry point

File: `packages/mobile/app/(app)/(tabs)/_layout.tsx`

Add a search icon button in the header right slot:
```tsx
<Pressable onPress={() => router.push('/(app)/search')}>
  <Ionicons name="search" size={22} />
</Pressable>
```

Or add a dedicated Search tab to the bottom tab bar (5th tab after Profile).

### 4.3 Search result navigation

Each search result card in mobile taps through to the appropriate detail screen:
- Skill → `/(app)/skills/[id]`
- Tool → `/(app)/tools/[id]`
- Event → `/(app)/events/[id]`
- Drive → `/(app)/drives/[id]`
- Food → `/(app)/food/[id]`

---

## 5. Execution Order

1. **Migrations** — write `src/db/migrations/0025_search_indexes.sql` with all 5 GIN indexes, run `drizzle-kit migrate`
2. **API** — `GET /api/search` with parallel queries + rate limit
3. **Web nav** — add search input to `nav.tsx`
4. **Web results page** — `search/page.tsx` + `_components/`
5. **Mobile search screen** — `search/index.tsx` + navigation entry
6. Code review + QA

---

## 6. Validation Checklist

- [ ] `plainto_tsquery` handles multi-word queries and special characters without throwing
- [ ] Bulgarian text (food titles) searched with `'simple'` dictionary — results return
- [ ] Empty `q` param returns 400, not 500
- [ ] `locationId` filter narrows results correctly
- [ ] Rate limiter returns 429 after threshold
- [ ] Nav search input redirects to `/search?q=...` on Enter
- [ ] Tab counts update when switching tabs
- [ ] Mobile debounce does not fire on every keystroke
- [ ] Result cards link to correct detail pages
- [ ] `npm run build:web` passes
- [ ] `npm run typecheck:mobile` passes
