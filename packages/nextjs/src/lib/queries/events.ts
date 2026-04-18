import { db } from '@/db'
import { events, eventAttendees, profiles, locations } from '@/db/schema'
import { and, count, desc, eq, gte, isNull, sql, SQL } from 'drizzle-orm'

export const eventSelect = {
  id:                   events.id,
  title:                events.title,
  description:          events.description,
  address:              events.address,
  imageUrl:             events.imageUrl,
  startsAt:             events.startsAt,
  endsAt:               events.endsAt,
  maxCapacity:          events.maxCapacity,
  status:               events.status,
  createdAt:            events.createdAt,
  updatedAt:            events.updatedAt,
  organizerId:          events.organizerId,
  organizerName:        profiles.name,
  locationId:           events.locationId,
  locationCity:         locations.city,
  locationNeighborhood: locations.neighborhood,
} as const

export type EventFilterOpts = {
  status?:  string
  from?:    string
  ownerId?: string
}

export function buildEventConditions(opts: EventFilterOpts): SQL[] {
  const conditions: SQL[] = [isNull(events.deletedAt)]
  if (opts.status)  conditions.push(eq(events.status, opts.status))
  if (opts.ownerId) conditions.push(eq(events.organizerId, opts.ownerId))
  if (opts.from)    conditions.push(gte(events.startsAt, new Date(opts.from)))
  return conditions
}

export async function queryEvents(opts: EventFilterOpts & { limit?: number; page?: number }) {
  const { limit = 20, page = 1, ...filterOpts } = opts
  const conditions = buildEventConditions(filterOpts)

  return db
    .select(eventSelect)
    .from(events)
    .leftJoin(profiles,  eq(profiles.userId,  events.organizerId))
    .leftJoin(locations, eq(locations.id,     events.locationId))
    .where(and(...conditions))
    .limit(limit)
    .offset((page - 1) * limit)
    .orderBy(events.startsAt)
}

export async function queryEventsPage(opts: EventFilterOpts & { limit?: number; page?: number }) {
  const { limit = 20, page = 1, ...filterOpts } = opts
  const conditions = buildEventConditions(filterOpts)

  const [rows, [{ total }]] = await Promise.all([
    queryEvents({ ...filterOpts, limit, page }),
    db.select({ total: count() }).from(events).where(and(...conditions)),
  ])

  return { events: rows, total }
}

export async function queryEventById(id: string) {
  const [row] = await db
    .select({
      ...eventSelect,
      attendeeCount: sql<number>`(
        SELECT count(*)::int FROM event_attendees
        WHERE event_id = ${events.id} AND status = 'attending'
      )`,
    })
    .from(events)
    .leftJoin(profiles,  eq(profiles.userId,  events.organizerId))
    .leftJoin(locations, eq(locations.id,     events.locationId))
    .where(and(eq(events.id, id), isNull(events.deletedAt)))
    .limit(1)

  return row ?? null
}

export async function queryUserRsvp(eventId: string, userId: string) {
  const [row] = await db
    .select({ id: eventAttendees.id, status: eventAttendees.status })
    .from(eventAttendees)
    .where(and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.userId, userId)))
    .limit(1)
  return row ?? null
}
