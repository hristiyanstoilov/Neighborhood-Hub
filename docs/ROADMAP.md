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
