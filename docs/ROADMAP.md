# Neighborhood Hub – Roadmap

A community platform for neighborhood sharing in Bulgaria.

---

## IMPORTANT: MVP Boundary

> **Capstone project (3–4 weeks):** Only v0.1 is implemented. Everything after v0.1 is product vision — do not touch until v0.1 is complete and deployed.

| Week | Focus | Status |
|------|-------|--------|
| 1 | Auth + DB schema + Monorepo setup + Deploy skeleton | ✅ done |
| 2 | Skill Listings (CRUD API + Web screens) | ✅ done |
| 3 | Skill Requests + Neighborhood Radar (map) + Admin panel | ✅ done |
| 4 | Mobile screens + Image uploads + Polish + README + 15+ commits | ✅ done |

---

## v0.1 – Module 1: Neighborhood Radar + Time & Skill Swap *(MVP – complete)*

### Neighborhood Radar (map)
- Interactive map with markers by type (skills, tools, events)
- Filter by marker type
- Click marker → item details
- **Note:** Location is neighborhood-level only (no exact address) – privacy/GDPR

### Time & Skill Swap
- Users publish skill listings (skill, category, hours/week, status)
- Session requests with date/time + format (online/offline)
- ~~Ratings and reviews~~ → removed from MVP (separate flow, edge cases)

### DB Tables (v0.1)
| Table | Description |
|-------|-------------|
| `users` | Auth + profile (id, email, password_hash, role, name, location_id) |
| `skills` | Skill listings (id, owner_id, title, category, available_hours, status) |
| `skill_requests` | Booking requests (id, user_from_id, user_to_id, skill_id, scheduled_start, status) |
| `locations` | Geo data for radar (id, lat, lng, type, city, neighborhood) |

### Web screens (v0.1)
| Screen | Route | Status |
|--------|-------|--------|
| Home / Dashboard | `/` | ✅ done |
| Register | `/register` | ✅ done |
| Login | `/login` | ✅ done |
| Forgot Password | `/forgot-password` | ✅ done |
| Reset Password | `/reset-password` | ✅ done |
| Verify Email | `/verify-email` | ✅ done |
| Skill List + Search + Filters | `/skills` | ✅ done |
| Skill Detail + Request form | `/skills/[id]` | ✅ done |
| Create Skill (with image upload) | `/skills/new` | ✅ done |
| Edit Skill | `/skills/[id]/edit` | ✅ done |
| My Requests | `/my-requests` | ✅ done |
| Profile View | `/profile` | ✅ done |
| Profile Edit (with avatar upload) | `/profile/edit` | ✅ done |
| Public User Profiles | `/users/[id]` | ✅ done |
| Admin — Users | `/admin/users` | ✅ done |
| Admin — Audit Log | `/admin/audit` | ✅ done |
| AI Chat | `/chat` | ✅ done |

### Mobile screens (v0.1)
| Screen | Status |
|--------|--------|
| Login / Register | ✅ done |
| Skill List (paginated) | ✅ done |
| Skill Detail + Request | ✅ done |
| My Requests (sent/received) | ✅ done |
| Profile + Avatar Upload | ✅ done |
| Neighborhood Radar (map) | ✅ done |

### AI Features (v0.1 – if time allows in Week 3)
- `/api/ai/chat` – AI chat assistant (required for "Full Stack Apps with AI" course)
- `/api/ai/recommendations` – skill recommendations

---

## Post-MVP Stabilization and Modularity Plan

This section tracks the next execution plan after closing critical DB/Auth issues.
Only high-value items are listed below.

### Must Have

1. Modularize large web screens without behavior changes
- Scope: skills, profile, users, chat, admin pages
- Goal: split monolithic pages into small feature components
- Success: build passes and routes keep same behavior

2. Reusable modal and confirmation patterns
- Scope: add/edit/delete flows across web app
- Goal: use one consistent confirm and form modal pattern
- Success: fewer duplicated modal implementations and consistent UX

3. Searchable picker pattern for reusable selection dialogs
- Scope: category, location, user, and other entity selectors
- Goal: one reusable searchable picker component and API
- Success: better UX on large datasets and less duplicated code

4. Unified async states
- Scope: list and detail pages with server data
- Goal: standard loading, empty, and error UI states
- Success: all key pages use the same async state conventions

5. DB/Auth hygiene maintenance
- Scope: refresh token cleanup for expired/revoked rows
- Goal: keep auth tables healthy over time
- Success: cleanup logic covered by smoke tests and no auth regressions

### Nice to Have

1. Standardized table-editor layout for admin-like screens
- Scope: users, categories, profile skills, and future CRUD-heavy pages

2. Better dependency-aware delete UX
- Scope: delete confirmations showing impact on related entities

3. Demo readiness polish
- Scope: better empty states, onboarding hints, and sample data quality

4. AI chat UX hardening
- Scope: clearer fallback states for provider unavailability (503)

### Technical Implementation Plan

1. Wave 1: Shared UI primitives
- Create reusable components for modal base, confirm dialog, loading/empty/error states
- Introduce shared action row patterns for list/table UIs

2. Wave 2: Skills feature modularization
- Refactor skills list/detail pages into feature folders and reusable sections
- Keep existing API contracts unchanged

3. Wave 3: Profile and public users modularization
- Split profile and public user pages into sections and shared blocks
- Reuse picker and async state components

4. Wave 4: Chat and admin consistency pass
- Standardize async/error feedback in chat and admin CRUD interactions
- Keep business logic unchanged (structure-only refactor)

5. Validation after each wave
- Run web build and route smoke tests
- Verify no TypeScript errors in changed files
- Keep commits small and feature-scoped

### Execution Rules

1. Do not change business logic unless explicitly requested.
2. Keep API response shapes backward-compatible.
3. Use small, meaningful commits per wave.
4. Exclude low-value ideas that do not improve stability, maintainability, or UX.

---

## v0.2 – Module 2: Neighborhood Tool Library *(planned – after MVP)*

- Share tools and household items (drill, ladder, lawnmower, etc.)
- Status: available / in use / on loan
- Reservations with date/time
- **DB:** `tools` + `tool_reservations`

---

## v0.3 – Module 3: Neighborhood Events *(planned – after MVP)*

- Community events + charity initiatives (charity is a subtype of event)
- RSVP / attendance registration
- **DB:** `events` + `event_attendees` (with field `event_type: 'community' | 'charity' | 'meetup'`)
- **Note:** Charity is not a separate module — use `event_type: 'charity'`

---

## v0.4 – Module 4: Neighborhood Food Sharing *(planned – after MVP)*

- Share surplus food (home-cooked, seasonal produce, etc.)
- Status: available / reserved / picked_up
- **DB:** `food_shares` + `food_reservations`

---

## v0.5 – Module 5: Neighborhood Chat / Feed *(planned – later)*

- Social feed of neighborhood activities
- Direct messages or group chats per neighborhood

---

## Product Vision (long-term)

### User Segments
| Segment | Description |
|---------|-------------|
| Individuals | Regular neighbors and citizens |
| Organizers | Event and campaign organizers |
| Charity | Non-profit organizations and volunteers |
| Businesses | Local businesses and partners |

### Business Model
- **Freemium** – Free (core features) + Premium (AI features, advanced analytics, API)
- **Ad-based** – Local businesses, sponsored content
- **Subscription** – Monthly/yearly for organizers and businesses
- **Partnerships** – NGOs, municipalities, media

### Q1–Q4 Timeline (post-capstone)
| Period | Focus |
|--------|-------|
| Q1 | MVP launch (Module 1) |
| Q2 | AI features + Tool Library + Events |
| Q3 | Enterprise features (analytics, branding, API) |
| Q4 | Expansion – new cities and regions |

### Vision
> Neighborhood Hub becomes the standard platform for neighborhood sharing in Bulgaria and Europe.

**Mission:** Help neighbors share skills, time, tools, and food.
**Values:** Community, Sharing, Collaboration, Trust.

---

## Notes and Risks

- **Map on mobile is non-trivial** – `react-native-maps` requires separate integration, allocate extra time
- **Location is neighborhood-level only**, not exact address – GDPR considerations
- **Empty state** for new users – map will be empty; add seed data or onboarding text
- **AI integration** is a course priority (Week 3), not "after all modules"
- ~~Module 5 (Tool Library duplicate)~~ → removed, see v0.2
- ~~Module 6 (Charity as separate module)~~ → merged into v0.3 Events as `event_type: 'charity'`
