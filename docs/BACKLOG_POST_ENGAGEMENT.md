# Post-Engagement Feature Backlog

This document covers work **planned but not yet committed** as of 2026-04-26.
All items below are ready to pick up in the next session.

---

## Status of Engagement Sprint (2026-04-26)

| Feature | Status | Commit |
|---------|--------|--------|
| Notification opt-out | ✅ Done | c5297bd |
| Content flagging + admin moderation queue | ✅ Done | 8e723c8 |
| GDPR Art. 17 (account deletion) + Art. 20 (data export) | ✅ Done | 1fea2b6 |
| Interactive map — web (react-leaflet) + mobile (react-native-maps) | ✅ Done | b8fd398 |
| Gamification / Neighbor Score (points + leaderboard) | ✅ Done | a10e667 |
| BG/EN internationalization (next-intl infrastructure + nav/landing/footer) | ✅ Done | b58747a |

---

## 1. i18n — Remaining Pages to Translate

**Infrastructure is complete** (next-intl installed, cookie-based locale, message files with 200+ keys).
The following pages still render hardcoded English strings. Each just needs `getTranslations()` (server) or `useTranslations()` (client) wired in.

### Auth pages (high priority — user's first impression)
All live in `packages/nextjs/src/app/(web)/`:

| Page | File | Key namespace |
|------|------|---------------|
| Login | `login/page.tsx` or `login/_components/` | `auth` |
| Register | `register/page.tsx` or `register/_components/` | `auth` |
| Forgot password | `forgot-password/page.tsx` | `auth` |
| Reset password | `reset-password/page.tsx` | `auth` |
| Verify email | `verify-email/page.tsx` | `auth` |

All translation keys already exist in `messages/en.json` and `messages/bg.json` under the `auth` namespace.

### Content/module pages (medium priority)
Each page needs only its static labels translated — listing titles, button labels, status pills, empty states. User-generated content (titles, descriptions) stays as-is.

| Page | File | Key namespace |
|------|------|---------------|
| Skills list | `skills/page.tsx` | `nav`, `common` |
| Skill detail | `skills/[id]/page.tsx` | `common` |
| Create/edit skill | `skills/new/`, `skills/[id]/edit/` | `common` |
| Tools list + detail | `tools/`, `tools/[id]/` | `common` |
| Events list + detail | `events/`, `events/[id]/` | `common` |
| Drives list + detail | `drives/`, `drives/[id]/` | `common` |
| Food list + detail + forms | `food/`, `food/[id]/` | `common` |
| Map page | `map/page.tsx` | `map` |
| Feed | `feed/page.tsx` | `feed` |
| Notifications | `notifications/page.tsx` | `notifications` |
| Profile view | `profile/page.tsx` | `profile` |
| Profile edit | `profile/edit/` | `edit_profile` |
| Leaderboard | `leaderboard/page.tsx` | `leaderboard` ✅ already done |

### Mobile i18n
Mobile uses a different stack (Expo). Approach for the next session:
- Install `expo-localization` + `i18next` + `react-i18next` in `packages/mobile`
- Create `packages/mobile/lib/i18n.ts` with the same EN/BG key structure
- Reads locale from `Localization.locale` (falls back to EN)
- Update key screens: tab bar labels, empty states, button labels

---

## 2. Production Polish (from plan `sorted-giggling-wolf.md`)

These are small, surgical UI improvements to existing food module flows.

### 2.1 Web — Toast on food creation
**File:** `packages/nextjs/src/app/(web)/food/new/new-food-form.tsx`

After `router.push(...)` on success, add `showToast('Food share created!')`.
Import `useToast` from the existing toast context.

### 2.2 Web — Toasts on food reservation actions
**File:** `packages/nextjs/src/app/(web)/food/[id]/reservation-section.tsx`

Add `showToast(...)` after each successful mutation:
- Reserve → `'Reservation requested!'`
- Owner approve → `'Reservation approved.'`
- Owner reject → `'Reservation declined.'`
- Mark picked up → `'Marked as picked up.'`
- Cancel → `'Reservation cancelled.'`

### 2.3 Web — Confirmation dialogs for reservation mutations
**File:** `packages/nextjs/src/app/(web)/food/[id]/reservation-section.tsx`

Wrap approve / reject / picked_up / cancel handlers with the existing `ConfirmDialog` component from `packages/nextjs/src/components/ui/confirm-dialog.tsx`.
- Approve: *"Approve this reservation?"*
- Reject: *"Decline this reservation? The slot will reopen."*
- Picked up: *"Mark as picked up? This closes the food share."*
- Cancel: *"Cancel your reservation?"*

Also apply the same pattern in `packages/nextjs/src/app/(web)/my-reservations/reservation-card.tsx`.

### 2.4 Mobile — Empty states for list screens
Pattern: if `data.length === 0 && !loading`, render centered `<Text>` with a message.

| File | Empty message |
|------|---------------|
| `packages/mobile/app/(app)/food/index.tsx` | `"No food shares nearby yet."` |
| `packages/mobile/app/(app)/(tabs)/index.tsx` | verify `SkillsEmptyState` wired to empty case |
| Events/Drives tab screens if blank on empty | add inline empty state |

### 2.5 Mobile — Wire toast for food mutations
`ToastProvider` and `useToast` already exist in `packages/mobile/lib/toast.tsx` and are mounted in `_layout.tsx`.

| File | When to fire |
|------|-------------|
| `packages/mobile/app/(app)/food/new.tsx` | after create success |
| `packages/mobile/app/(app)/food/[id].tsx` | after reserve / cancel |
| `packages/mobile/app/(app)/food/edit/[id].tsx` | after save / delete |

---

## 3. AGENTS.md Documentation Update

**File:** `AGENTS.md`

The following sections are stale and need updating:

### 3.1 Module status table (Section 8)
Mark food module as done:
```
| 0.4 | Food Sharing | Planned |  →  | 0.4 | Food Sharing | ✅ Done |
```

### 3.2 Schema table (Section 4)
Current count says "18 tables". Actual count is now **25 tables**. Add the missing tables:
```
| `food_shares`       | Food listings |
| `food_reservations` | Food reservations |
| `content_reports`   | Content flagging + moderation |
| `point_events`      | Gamification point ledger |
| `user_stats`        | Aggregated points + level per user |
```

### 3.3 API routes tree (Section 3)
Add:
```
├── food-shares/          # CRUD food listings + reservations state machine
├── food-reservations/    # list user reservations across all food shares
├── reports/              # POST content flag
├── admin/reports/        # GET moderation queue + PATCH resolve
├── map/                  # GET all geo-pinned items (skills/tools/food/events)
├── leaderboard/          # GET top 50 users by points
├── me/stats/             # GET current user's points, level, rank
├── account/              # GET data export (Art. 20) + DELETE account (Art. 17)
```

### 3.4 Web screens (Section 7)
Add all screens built in the engagement sprint:
```
| Food List + Search       | /food              | ✅ Done |
| Food Detail + Reserve    | /food/[id]         | ✅ Done |
| Create Food Share        | /food/new          | ✅ Done |
| Edit Food Share          | /food/[id]/edit    | ✅ Done |
| My Food Reservations     | /food/reservations | ✅ Done |
| Notifications (inbox)    | /notifications     | ✅ Done |
| Interactive Map          | /map               | ✅ Done |
| Leaderboard              | /leaderboard       | ✅ Done |
| Admin — Reports queue    | /admin/reports     | ✅ Done |
```

### 3.5 Mobile screens (Section 7)
```
| Food List (paginated)    | ✅ Done |
| Food Detail + Reserve    | ✅ Done |
| Create Food Share        | ✅ Done |
| Edit Food Share          | ✅ Done |
| My Food Reservations     | ✅ Done |
| Interactive Map tab      | ✅ Done |
| Leaderboard / Rankings tab | ✅ Done |
```

---

## 4. QA Regression Pack Additions

**File:** `docs/QA_REGRESSION_PACK.md`

Add the following test case sections following the existing `MODULE-##` format:

### 4.1 Food Sharing (FOOD-01 … FOOD-08)
| ID | Scenario | Expected |
|----|----------|----------|
| FOOD-01 | Create food share (auth + verified email) | 201, food object |
| FOOD-02 | List food shares (public) | 200, paginated |
| FOOD-03 | Create reservation | 201, status=pending |
| FOOD-04 | Duplicate active reservation blocked | 409 DUPLICATE_RESERVATION |
| FOOD-05 | Owner approves reservation | 200, status=reserved |
| FOOD-06 | Owner marks picked up | 200, food status=picked_up |
| FOOD-07 | Requester cancels | 200 |
| FOOD-08 | Non-owner actions blocked | 403 FORBIDDEN |

### 4.2 Password Reset (AUTH-06 … AUTH-09)
| ID | Scenario | Expected |
|----|----------|----------|
| AUTH-06 | forgot-password with any email → always 200 | No enumeration oracle |
| AUTH-07 | reset-password with valid token | 200, refresh tokens revoked |
| AUTH-08 | reset-password with expired token | 400 TOKEN_EXPIRED |
| AUTH-09 | reset-password token single-use | 400 INVALID_TOKEN on second use |

### 4.3 Email Verification (AUTH-10 … AUTH-11)
| ID | Scenario | Expected |
|----|----------|----------|
| AUTH-10 | Verify with valid token | 200, emailVerifiedAt set |
| AUTH-11 | Verify with expired/invalid token | 400 TOKEN_EXPIRED / INVALID_TOKEN |

### 4.4 Content Flagging (MOD-01 … MOD-04)
| ID | Scenario | Expected |
|----|----------|----------|
| MOD-01 | Flag a skill (auth required) | 201 |
| MOD-02 | Duplicate active flag blocked | 409 |
| MOD-03 | Admin views pending reports | 200, list with reporter info |
| MOD-04 | Admin resolves report | 200, resolvedAt set |

### 4.5 Gamification (POINTS-01 … POINTS-04)
| ID | Scenario | Expected |
|----|----------|----------|
| POINTS-01 | Create skill → +20 pts | user_stats.total_points += 20 |
| POINTS-02 | Tool returned → owner +15 pts | user_stats.total_points += 15 |
| POINTS-03 | 5-star rating received → +25 pts | point_events row inserted |
| POINTS-04 | GET /api/leaderboard | 200, ordered by points desc |

---

## 5. Tier 3 Features (Nice to Have)

These are lower priority and should only be started after items 1–4 above are done.

### 5.1 Demo Mode
- Pre-seeded demo account (email: `demo@neighborhoodhub.bg`, password: `demo1234`)
- Write operations (POST/PUT/DELETE) disabled for demo user at middleware level
- Banner shown in nav when browsing as demo user
- **Effort:** 1 day

### 5.2 Badges / Achievements
- New table: `badges (id, userId, type, awardedAt)`
- Badge types: `first_skill`, `first_tool`, `first_food`, `ten_points`, `fifty_points`, `five_star_giver`, `community_hero`
- Award on milestone in `awardPoints()` (or a separate `checkMilestones()` call)
- Show badges grid on profile page
- **Effort:** 1–2 days

### 5.3 Analytics (PostHog or Plausible)
- Add PostHog script to root layout (or use `next-plausible`)
- Track key events: `skill_request_created`, `tool_reserved`, `food_share_created`, `drive_pledged`
- No PII in event properties
- **Effort:** 0.5 days

---

## Execution Order for Next Session

1. **AGENTS.md update** (30 min, docs only, zero risk)
2. **QA Regression Pack additions** (45 min, docs only, zero risk)
3. **Production polish — web toasts + confirm dialogs** (1 hour, surgical changes)
4. **Production polish — mobile empty states + toasts** (1 hour)
5. **i18n — auth pages** (1 hour, high user-facing impact)
6. **i18n — content pages** (2–3 hours, lower priority)
7. **Tier 3 features** (only after 1–6 are done)
