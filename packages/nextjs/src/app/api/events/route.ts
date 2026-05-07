import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { events, eventAttendees } from '@/db/schema'
import { and, count, isNull } from 'drizzle-orm'
import { apiRatelimit, createRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireVerifiedAuthWithRateLimit } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { createEventSchema, listEventsSchema } from '@/lib/schemas/event'
import { buildEventConditions, eventSelect, queryEvents } from '@/lib/queries/events'
import { eq } from 'drizzle-orm'
import { createFeedEvent } from '@/lib/create-feed-event'

// ─── GET /api/events — public listing ───────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(ip)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const { searchParams } = new URL(req.url)
    const parsed = listEventsSchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { status, from, search, limit, page } = parsed.data
    const conditions = buildEventConditions({ status, from, search })

    const [rows, [{ total }]] = await Promise.all([
      queryEvents({ status, from, search, limit, page }),
      db.select({ total: count() }).from(events).where(and(...conditions)),
    ])

    return NextResponse.json({ data: rows, page, limit, total })
  } catch (err) {
    console.error('[GET /api/events]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// ─── POST /api/events — create ───────────────────────────────────────────────

export const POST = requireVerifiedAuthWithRateLimit(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)
    const { success: createOk } = await createRatelimit.limit(user.sub)
    if (!createOk) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const body = await req.json().catch(() => null)
    if (body === null) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
    const parsed = createEventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { title, description, locationId, address, startsAt, endsAt, maxCapacity, imageUrl } = parsed.data

    if (endsAt && new Date(endsAt) <= new Date(startsAt)) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: 'endsAt must be after startsAt' }, { status: 400 })
    }

    const [event] = await db.insert(events).values({
      organizerId: user.sub,
      title,
      description:  description ?? null,
      locationId:   locationId ?? null,
      address:      address ?? null,
      startsAt:     new Date(startsAt),
      endsAt:       endsAt ? new Date(endsAt) : null,
      maxCapacity:  maxCapacity ?? null,
      imageUrl:     imageUrl ?? null,
    }).returning()

    // Organizer is automatically the first attendee
    await db.insert(eventAttendees).values({ eventId: event.id, userId: user.sub })

    await writeAuditLog({ userId: user.sub, userEmail: user.email, action: 'create', entity: 'events', entityId: event.id, ipAddress: ip })

    void createFeedEvent({
      actorId:    user.sub,
      eventType:  'event_created',
      targetId:   event.id,
      targetTitle: event.title,
      targetUrl:  `/events/${event.id}`,
    }).catch(() => undefined)

    return NextResponse.json({ data: event }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/events]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
