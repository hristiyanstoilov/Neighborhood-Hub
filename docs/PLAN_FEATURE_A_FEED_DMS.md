# Feature A — v0.5 Neighborhood Feed & Direct Messages: Technical Implementation Plan

## Overview

Two connected sub-features:
1. **Activity Feed** — a reverse-chronological stream of neighborhood activity (new skills, new events, new food shares, new drives) scoped to the viewer's neighborhood. Read-only, no user-authored posts. Computed from existing tables.
2. **Direct Messages (DMs)** — peer-to-peer text messaging between any two users. Separate from the existing AI chat (`ai_conversations` / `ai_messages`).

Both ship as a single v0.5 release. The feed is simpler — implement it first.

---

## 1. Database Schema

### 1.1 DM tables

Two new tables in `packages/nextjs/src/db/schema.ts`:

```typescript
// ─────────────────────────────────────────────
// CONVERSATIONS (one row per DM thread)
// ─────────────────────────────────────────────
export const conversations = pgTable(
  'conversations',
  {
    id:            uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    participantA:  uuid('participant_a').notNull().references(() => users.id, { onDelete: 'cascade' }),
    participantB:  uuid('participant_b').notNull().references(() => users.id, { onDelete: 'cascade' }),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
    createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    // enforce exactly one conversation per pair (A < B by convention)
    uniqueIndex('conversations_pair_idx').on(t.participantA, t.participantB),
    index('conversations_participant_a_idx').on(t.participantA),
    index('conversations_participant_b_idx').on(t.participantB),
    check('conversations_no_self_chat_check', sql`${t.participantA} != ${t.participantB}`),
  ]
)

// ─────────────────────────────────────────────
// DIRECT MESSAGES
// ─────────────────────────────────────────────
export const directMessages = pgTable(
  'direct_messages',
  {
    id:             uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    conversationId: uuid('conversation_id').notNull()
                      .references(() => conversations.id, { onDelete: 'cascade' }),
    senderId:       uuid('sender_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    content:        text('content').notNull(),
    readAt:         timestamp('read_at', { withTimezone: true }),
    createdAt:      timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('direct_messages_conversation_id_idx').on(t.conversationId),
    index('direct_messages_sender_id_idx').on(t.senderId),
    index('direct_messages_conversation_created_idx').on(t.conversationId, t.createdAt),
    check('direct_messages_content_length_check', sql`char_length(${t.content}) >= 1 AND char_length(${t.content}) <= 2000`),
  ]
)
```

**Convention:** `participantA` always holds the lexicographically smaller UUID. Enforced in the API before insert — this guarantees the `UNIQUE` constraint catches duplicate conversation creation.

### 1.2 Activity feed — no new tables

The feed is computed on-the-fly from existing tables using a UNION query. No persistence needed.

### 1.3 Unread count on conversations

Add a helper view (or compute in query) — count `direct_messages` where `sender_id != viewer` AND `read_at IS NULL` for each conversation.

### 1.4 Migration

```bash
cd packages/nextjs
npx drizzle-kit generate
npx drizzle-kit migrate
```

Commit the generated SQL files in `src/db/migrations/`.

---

## 2. API Routes — Activity Feed

### 2.1 `GET /api/feed` — neighborhood activity stream

File: `packages/nextjs/src/app/api/feed/route.ts`

**Auth:** requireAuth.

**Query params:**
```
locationId   string   optional — filter to a specific neighborhood (default: viewer's profile locationId)
limit        number   default 20, max 50
cursor       string   ISO timestamp — for cursor-based pagination ("before this date")
```

**Logic:**

Run a UNION ALL across five tables, selecting a common shape:

```typescript
const feedQuery = sql`
  SELECT
    s.id,
    'skill'      AS type,
    s.title,
    s.description,
    p.name       AS author_name,
    p.avatar_url AS author_avatar,
    s.owner_id   AS author_id,
    s.location_id,
    l.neighborhood,
    s.created_at
  FROM skills s
  JOIN profiles p ON p.user_id = s.owner_id
  LEFT JOIN locations l ON l.id = s.location_id
  WHERE s.deleted_at IS NULL
    AND s.status = 'available'
    ${locationId ? sql`AND s.location_id = ${locationId}` : sql``}
    ${cursor ? sql`AND s.created_at < ${cursor}` : sql``}

  UNION ALL

  SELECT
    t.id,
    'tool'       AS type,
    t.title,
    t.description,
    p.name,
    p.avatar_url,
    t.owner_id,
    t.location_id,
    l.neighborhood,
    t.created_at
  FROM tools t
  JOIN profiles p ON p.user_id = t.owner_id
  LEFT JOIN locations l ON l.id = t.location_id
  WHERE t.deleted_at IS NULL
    AND t.status = 'available'
    ${locationId ? sql`AND t.location_id = ${locationId}` : sql``}
    ${cursor ? sql`AND t.created_at < ${cursor}` : sql``}

  UNION ALL

  SELECT
    e.id, 'event', e.title, e.description,
    p.name, p.avatar_url, e.organizer_id, e.location_id, l.neighborhood, e.created_at
  FROM events e
  JOIN profiles p ON p.user_id = e.organizer_id
  LEFT JOIN locations l ON l.id = e.location_id
  WHERE e.deleted_at IS NULL AND e.status = 'published'
    ${locationId ? sql`AND e.location_id = ${locationId}` : sql``}
    ${cursor ? sql`AND e.created_at < ${cursor}` : sql``}

  UNION ALL

  SELECT
    d.id, 'drive', d.title, d.description,
    p.name, p.avatar_url, d.organizer_id, NULL, NULL, d.created_at
  FROM community_drives d
  JOIN profiles p ON p.user_id = d.organizer_id
  WHERE d.deleted_at IS NULL AND d.status = 'open'
    ${cursor ? sql`AND d.created_at < ${cursor}` : sql``}

  UNION ALL

  SELECT
    f.id, 'food', f.title, f.description,
    p.name, p.avatar_url, f.owner_id, f.location_id, l.neighborhood, f.created_at
  FROM food_shares f
  JOIN profiles p ON p.user_id = f.owner_id
  LEFT JOIN locations l ON l.id = f.location_id
  WHERE f.deleted_at IS NULL AND f.status = 'available'
    ${locationId ? sql`AND f.location_id = ${locationId}` : sql``}
    ${cursor ? sql`AND f.created_at < ${cursor}` : sql``}

  ORDER BY created_at DESC
  LIMIT ${limit}
`
```

**Response shape:**
```typescript
{
  data: {
    items: FeedItem[],
    nextCursor: string | null,   // created_at of the last item, or null if < limit returned
  }
}
```

**FeedItem type:**
```typescript
interface FeedItem {
  id: string
  type: 'skill' | 'tool' | 'event' | 'drive' | 'food'
  title: string
  description: string | null
  authorName: string
  authorAvatar: string | null
  authorId: string
  locationId: string | null
  neighborhood: string | null
  createdAt: string
}
```

---

## 3. API Routes — Direct Messages

### 3.1 `GET /api/conversations` — list viewer's conversations

File: `packages/nextjs/src/app/api/conversations/route.ts`

**Auth:** requireAuth.

Returns all conversations where `participant_a = viewer OR participant_b = viewer`, joined with the other participant's profile (name, avatar) and the last message preview.

```typescript
// subquery: last message per conversation
// main query: join conversations + profiles + last_message
```

Response:
```typescript
{
  data: ConversationSummary[]
}

interface ConversationSummary {
  id: string
  otherUserId: string
  otherUserName: string
  otherUserAvatar: string | null
  lastMessageContent: string | null
  lastMessageAt: string | null
  unreadCount: number
}
```

### 3.2 `POST /api/conversations` — start or retrieve a conversation

File: `packages/nextjs/src/app/api/conversations/route.ts` (POST handler)

**Auth:** requireAuth.

**Body:** `{ otherUserId: string }`

**Logic:**
1. Validate `otherUserId` is a real user (not self).
2. Compute `[participantA, participantB]` = sort `[viewer.id, otherUserId]` lexicographically.
3. `INSERT INTO conversations (participant_a, participant_b) VALUES (...) ON CONFLICT (participant_a, participant_b) DO NOTHING RETURNING id`.
4. If no row returned (conflict), fetch existing row.
5. Return `{ data: { conversationId } }`.

### 3.3 `GET /api/conversations/[id]/messages` — list messages

File: `packages/nextjs/src/app/api/conversations/[id]/messages/route.ts`

**Auth:** requireAuth. Verify viewer is a participant.

**Query params:** `limit=50&cursor=<iso-timestamp>`

**Logic:**
1. Fetch messages ordered by `created_at DESC`, limit + cursor.
2. Mark unread messages (sender ≠ viewer, read_at IS NULL) as read in bulk:
   ```typescript
   await db.update(directMessages)
     .set({ readAt: new Date() })
     .where(and(
       eq(directMessages.conversationId, id),
       ne(directMessages.senderId, viewer.id),
       isNull(directMessages.readAt),
     ))
   ```
3. Return messages in ascending order (client reverses if needed), with `nextCursor`.

### 3.4 `POST /api/conversations/[id]/messages` — send a message

File: `packages/nextjs/src/app/api/conversations/[id]/messages/route.ts` (POST handler)

**Auth:** requireAuth. Verify viewer is a participant.

**Body:** `{ content: string }` — zod validates min 1, max 2000 chars.

**Logic:**
1. Insert into `direct_messages`.
2. Update `conversations.last_message_at = now()`.
3. Insert a `notification` for the other participant:
   ```typescript
   await db.insert(notifications).values({
     userId: otherParticipantId,
     type: 'new_message',
     title: `New message from ${viewer.name}`,
     body: content.slice(0, 100),
     linkUrl: `/messages/${id}`,
   })
   ```
4. Return `{ data: message }`.

**Rate limit:** 10 messages per minute per user (prevent spam).

### 3.5 `GET /api/conversations/unread-count` — badge count

File: `packages/nextjs/src/app/api/conversations/unread-count/route.ts`

**Auth:** requireAuth.

Returns total unread messages across all of the viewer's conversations:
```typescript
{ data: { count: number } }
```

Used by the nav bar badge. Polled every 30s via `useQuery` with `staleTime: 30_000`.

---

## 4. Web Screens — Activity Feed

### 4.1 Feed page

File: `packages/nextjs/src/app/(web)/feed/page.tsx`

Route: `/feed`

- Server component for initial render (passes first page of items)
- `<FeedList>` client component handles infinite scroll / load more
- Neighborhood filter selector (same locations dropdown as search)
- Each `<FeedCard>` shows: type badge (color-coded), title, author avatar + name, neighborhood, time-ago

File: `packages/nextjs/src/app/(web)/feed/_components/feed-card.tsx`

Click on a feed card → navigates to the module detail page:
- skill → `/skills/[id]`
- tool → `/tools/[id]`
- event → `/events/[id]`
- drive → `/drives/[id]`
- food → `/food/[id]`

### 4.2 Add Feed link to nav and dashboard

- `packages/nextjs/src/components/nav.tsx` — add "Feed" link between logo and search
- `packages/nextjs/src/app/(web)/page.tsx` — add Feed tile to the Browse section (replace placeholder if needed)

### 4.3 TanStack Query keys

```typescript
feed: {
  all: ['feed'] as const,
  list: (locationId?: string) => ['feed', 'list', locationId ?? 'all'] as const,
}
```

---

## 5. Web Screens — Direct Messages

### 5.1 Conversations list page

File: `packages/nextjs/src/app/(web)/messages/page.tsx`

Route: `/messages`

- Lists all conversations sorted by `last_message_at DESC`
- Each row: avatar, name, last message preview, unread count badge, time-ago
- Click → `/messages/[conversationId]`
- "New message" button → opens user picker modal

### 5.2 Conversation thread page

File: `packages/nextjs/src/app/(web)/messages/[id]/page.tsx`

- Message bubbles (viewer = right-aligned, other = left-aligned)
- Timestamp shown per message or grouped by day
- Textarea at bottom + Send button (or Enter key)
- Polling: `refetchInterval: 5000` (every 5s) — no WebSockets needed for MVP
- Load older messages on scroll to top ("Load more")
- Marks messages as read on mount (handled by the GET messages API)

File: `packages/nextjs/src/app/(web)/messages/[id]/_components/message-bubble.tsx`
File: `packages/nextjs/src/app/(web)/messages/[id]/_components/message-input.tsx`

### 5.3 Start conversation from public profile

File: `packages/nextjs/src/app/(web)/users/[id]/page.tsx`

Add "Send message" button. On click:
1. Call `POST /api/conversations` with `otherUserId`
2. Navigate to `/messages/[conversationId]`

### 5.4 Unread badge in nav

File: `packages/nextjs/src/components/nav.tsx`

Add a messages icon (envelope) next to notifications bell:
- `useQuery` polls `GET /api/conversations/unread-count` every 30s
- Show red badge if `count > 0`
- Click → `/messages`

---

## 6. Mobile Screens — Activity Feed

### 6.1 Feed tab

File: `packages/mobile/app/(app)/(tabs)/feed.tsx`

- Add "Feed" as a new bottom tab (replace one of the less-used tabs, or add a 5th tab)
- `FlatList` of feed items with `onEndReached` pagination
- Pull-to-refresh
- Neighborhood filter as a horizontal chip row at top (tap to filter)
- Each item: colored type badge + title + author name + time-ago
- Tap → navigate to correct module detail screen

### 6.2 Tab layout change

File: `packages/mobile/app/(app)/(tabs)/_layout.tsx`

Add the Feed tab icon (e.g., `Ionicons name="newspaper-outline"`).

---

## 7. Mobile Screens — Direct Messages

### 7.1 Messages tab or screen

File: `packages/mobile/app/(app)/messages/index.tsx`

- Conversation list (same shape as web)
- `FlatList` sorted by `last_message_at`
- Unread badge on each row

### 7.2 Conversation thread screen

File: `packages/mobile/app/(app)/messages/[id].tsx`

- Inverted `FlatList` (newest at bottom) of message bubbles
- `TextInput` + Send button pinned at bottom (above keyboard)
- `KeyboardAvoidingView` for iOS/Android keyboard handling
- Polling every 8s via `useQuery` `refetchInterval`
- Pull-to-refresh loads older messages

### 7.3 Start conversation from user profile

File: `packages/mobile/app/(app)/users/[id].tsx`

Add "Message" button — calls `POST /api/conversations`, navigates to thread screen.

### 7.4 Unread badge

File: `packages/mobile/app/(app)/(tabs)/_layout.tsx`

Poll `GET /api/conversations/unread-count` every 60s and show badge on the Messages tab icon using Expo's `tabBarBadge`.

---

## 8. TanStack Query Keys (web)

Add to `packages/nextjs/src/lib/query-keys.ts`:

```typescript
conversations: {
  all: ['conversations'] as const,
  list: (userId: string) => ['conversations', 'list', userId] as const,
  messages: (conversationId: string) => ['conversations', 'messages', conversationId] as const,
  unreadCount: (userId: string) => ['conversations', 'unread', userId] as const,
},
feed: {
  all: ['feed'] as const,
  list: (locationId?: string) => ['feed', 'list', locationId ?? 'all'] as const,
},
```

---

## 9. Seed Data

Add to `packages/nextjs/src/db/seed.ts` — new `seedMessages()` function:

- Create 2 conversations: ivan↔maria, georgi↔elena
- Seed 4–6 messages per conversation with realistic content
- Leave 1 message in each thread unread (no `readAt`) to demo the badge

Call `seedMessages()` after `seedDrives()` in the main flow (guard with `if existing conversations > 0 return`).

---

## 10. Execution Order

1. **DB migration** — `conversations` + `direct_messages` tables
2. **Feed API** — `GET /api/feed` with UNION query
3. **DM API** — conversations CRUD + messages CRUD + unread-count
4. **Web feed page** — `/feed` + nav link + dashboard tile
5. **Web messages** — `/messages` list + `/messages/[id]` thread + nav badge
6. **Web profile** — "Send message" button
7. **Mobile feed tab** — `feed.tsx` + tab layout
8. **Mobile messages** — `messages/index.tsx` + `messages/[id].tsx`
9. **Mobile profile** — "Message" button
10. **Seed data**
11. Code review + QA

---

## 11. Validation Checklist

- [ ] Conversation deduplication: creating A↔B twice returns same conversation ID
- [ ] Self-messaging is blocked (409 or 400)
- [ ] Non-participant cannot read or post to a conversation (403)
- [ ] Messages marked as read on fetch
- [ ] Unread badge count decrements after opening a conversation
- [ ] Feed UNION returns items from all 5 modules
- [ ] Feed `locationId` filter narrows to correct neighborhood
- [ ] Cursor pagination returns correct next page
- [ ] Notification inserted on new message
- [ ] Rate limit: 11th message in a minute returns 429
- [ ] Mobile keyboard does not cover the message input on iOS and Android
- [ ] `npm run build:web` passes
- [ ] `npm run typecheck:mobile` passes
