import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { events, eventAttendees, users } from '@/db/schema'
import { and, count, eq, isNull } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireAuth } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { queryUserRsvp } from '@/lib/queries/events'
import { createNotification } from '@/lib/create-notification'

// URL: /api/events/[id]/rsvp  → id is second-to-last segment
function extractEventId(url: string): string {
  const parts = new URL(url).pathname.split('/').filter(Boolean)
  return parts.at(-2) ?? ''
}

// ─── POST /api/events/[id]/rsvp — attend ────────────────────────────────────

export const POST = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.sub) })
    if (!dbUser?.emailVerifiedAt) {
      return NextResponse.json({ error: 'UNVERIFIED_EMAIL' }, { status: 403 })
    }

    const eventId = extractEventId(req.url)
    const event = await db.query.events.findFirst({ where: and(eq(events.id, eventId), isNull(events.deletedAt)) })
    if (!event) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (event.organizerId === user.sub) return NextResponse.json({ error: 'CANNOT_RSVP_OWN_EVENT' }, { status: 422 })
    if (event.status !== 'published') return NextResponse.json({ error: 'EVENT_NOT_OPEN' }, { status: 422 })

    // Check capacity
    if (event.maxCapacity !== null) {
      const [{ attending }] = await db
        .select({ attending: count() })
        .from(eventAttendees)
        .where(and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.status, 'attending')))

      if (attending >= event.maxCapacity) {
        return NextResponse.json({ error: 'EVENT_FULL' }, { status: 409 })
      }
    }

    // Idempotent — if already attending return 200
    const existing = await queryUserRsvp(eventId, user.sub)
    if (existing?.status === 'attending') {
      return NextResponse.json({ data: { status: 'attending' } })
    }

    if (existing) {
      // Re-attending after cancelling
      const [updated] = await db
        .update(eventAttendees)
        .set({ status: 'attending' })
        .where(eq(eventAttendees.id, existing.id))
        .returning()
      return NextResponse.json({ data: updated })
    }

    const [attendee] = await db.insert(eventAttendees).values({
      eventId,
      userId: user.sub,
    }).returning()

    // Notify organizer
    void createNotification({
      userId: event.organizerId,
      type: 'event_new_rsvp',
      entityType: 'event',
      entityId: eventId,
    }).catch(() => {})

    return NextResponse.json({ data: attendee }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/events/[id]/rsvp]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

// ─── DELETE /api/events/[id]/rsvp — cancel RSVP ─────────────────────────────

export const DELETE = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const eventId = extractEventId(req.url)
    const [existing, event] = await Promise.all([
      queryUserRsvp(eventId, user.sub),
      db.query.events.findFirst({ where: and(eq(events.id, eventId), isNull(events.deletedAt)) }),
    ])
    if (!existing || existing.status === 'cancelled') {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const [updated] = await db
      .update(eventAttendees)
      .set({ status: 'cancelled' })
      .where(eq(eventAttendees.id, existing.id))
      .returning()

    if (event) {
      void createNotification({
        userId: event.organizerId,
        type: 'event_rsvp_cancelled',
        entityType: 'event_rsvp',
        entityId: eventId,
      }).catch(() => {})
    }

    await writeAuditLog({
      userId:    user.sub,
      userEmail: user.email,
      action:    'update',
      entity:    'event_attendees',
      entityId:  existing.id,
      ipAddress: ip,
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[DELETE /api/events/[id]/rsvp]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
