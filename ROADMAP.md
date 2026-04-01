# Neighborhood Hub – Roadmap

Социална платформа за квартално споделяне в България.

---

## ВАЖНО: MVP граница

> **Капстоун проект (3-4 седмици):** Само v0.1 се имплементира. Всичко след v0.1 е product vision – не се пипа докато v0.1 не е завършен и деплойнат.

| Седмица | Фокус |
|---------|-------|
| 1 | Auth + DB schema + Monorepo setup + Deploy skeleton |
| 2 | Skill Listings (CRUD API + Web screens) |
| 3 | Skill Requests + Neighborhood Radar (карта) + Admin panel |
| 4 | Mobile screens (3+) + Polish + README + 15 commits |

---

## v0.1 – Module 1: Квартален радар + Time & Skill Swap *(MVP – активен)*

### Квартален радар (карта)
- Интерактивна карта с маркери по тип (умения, инструменти, събития)
- Филтриране по тип маркер
- Клик върху маркер → детайли на item-а
- **Бележка:** Локацията е на ниво квартал (не точен адрес) – privacy/GDPR

### Time & Skill Swap
- Потребители публикуват skill listings (умение, категория, часове/седмица, статус)
- Заявки за час + формат online/offline
- ~~Рейтинги и отзиви~~ → извадени от MVP (отделен flow, edge cases)

### DB таблици (v0.1)
| Таблица | Описание |
|---------|---------|
| `users` | Auth + профил (id, email, password_hash, role, name, city, neighborhood) |
| `skills` | Skill listings (id, owner_id, title, category, available_hours, status) |
| `skill_requests` | Заявки (id, user_from_id, user_to_id, skill_id, date_time, status) |
| `locations` | Гео данни за радара (id, lat, lng, type, city, neighborhood) |

### Web screens (v0.1)
| Екран | Route |
|-------|-------|
| Register | `/register` |
| Login | `/login` |
| Neighborhood Radar (home) | `/` |
| Skill List | `/skills` |
| Skill Detail + Request form | `/skills/[id]` |
| My Requests | `/requests` |
| Profile | `/profile` |
| Admin Panel | `/admin` |

### Mobile screens (v0.1 – минимум 3)
| Екран |
|-------|
| Login / Register |
| Skill List |
| Skill Detail + Request |

### AI Features (v0.1 – ако остане време в Week 3)
- `/api/ai/chat` – AI чат помощник (важно за курс "Full Stack Apps with AI")
- `/api/ai/recommendations` – препоръки за умения

---

## v0.2 – Module 2: Квартална библиотека за вещи *(планиран – след MVP)*

- Споделяне на инструменти и домашни вещи (бормашина, стълба, косачка и др.)
- Статус: свободна / заета / назаем
- Резервации с дата/час
- **DB:** `tools` + `tool_reservations`

---

## v0.3 – Module 3: Neighborhood Events *(планиран – след MVP)*

- Квартални събития + благотворителни инициативи (тип `charity` е подтип на събитие)
- Записване за участие
- **DB:** `events` + `event_attendees` (с поле `event_type: 'community' | 'charity' | 'meetup'`)
- **Бележка:** Charity не е отделен модул – само `event_type: 'charity'`

---

## v0.4 – Module 4: Neighborhood Food Sharing *(планиран – след MVP)*

- Споделяне на излишна храна (домашно, сезонни плодове и др.)
- Статус: available / reserved / picked_up
- **DB:** `food_shares` + `food_reservations`

---

## v0.5 – Module 5: Neighborhood Chat / Feed *(планиран – по-късно)*

- Социален фийд на квартални активности
- Директни съобщения или групови чатове по квартал

---

## Product Vision (дългосрочно)

### User Segments
| Сегмент | Описание |
|---------|---------|
| Individuals | Обикновени съседи и граждани |
| Organizers | Организатори на събития и кампании |
| Charity | Благотворителни организации и доброволци |
| Businesses | Местни бизнеси и партньори |

### Business Model
- **Freemium** – Free (базови функции) + Premium (AI features, advanced analytics, API)
- **Ad-based** – Местни бизнеси, sponsored content
- **Subscription** – Monthly/yearly за организатори и бизнеси
- **Partnerships** – НПО, общини, медии

### Q1-Q4 Timeline (след капстоун)
| Период | Фокус |
|--------|-------|
| Q1 | MVP launch (Module 1) |
| Q2 | AI features + Tool Library + Events |
| Q3 | Enterprise features (analytics, branding, API) |
| Q4 | Expansion – нови градове и региони |

### Vision
> Neighborhood Hub да стане стандартна платформа за квартално споделяне в България и Европа.

**Mission:** Помага на съседите да споделят умения, време, инструменти и храна.
**Values:** Community, Sharing, Collaboration, Trust.

---

## Бележки и Рискове

- **Картата на mobile е нетривиална** – `react-native-maps` е отделна интеграция, планирай допълнително време
- **Локацията е neighborhood-level**, не точен адрес – GDPR съображения
- **Empty state** при нови потребители – картата ще е празна; добави seed data или onboarding текст
- **AI интеграцията** е приоритет за курса (Week 3), не "след всички модули"
- ~~Module 5 (Tool Library дубликат)~~ → изтрит, вж. v0.2
- ~~Module 6 (Charity отделен модул)~~ → merged в v0.3 Events като `event_type: 'charity'`
