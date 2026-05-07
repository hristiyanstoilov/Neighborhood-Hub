import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { events, eventAttendees, userBlocks } from '@/db/schema'
import { and, eq, isNull, or, sql } from 'drizzle-orm'
import { getClientIp, requireAuthWithRateLimit, requireVerifiedAuthWithRateLimit } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { queryUserRsvp } from '@/lib/queries/events'
import { createNotification } from '@/lib/create-notification'

// ─── POST /api/events/[id]/rsvp — attend ────────────────────────────────────

export const POST = requireVerifiedAuthWithRateLimit(async (req: NextRequest, { user, params }) => {
  try {
    const eventId = params.id
    const event = await db.query.events.findFirst({ where: and(eq(events.id, eventId), isNull(events.deletedAt)) })
    if (!event) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (event.organizerId === user.sub) return NextResponse.json({ error: 'CANNOT_RSVP_OWN_EVENT' }, { status: 422 })
    if (event.status !== 'published') return NextResponse.json({ error: 'EVENT_NOT_OPEN' }, { status: 422 })

    const [blockRow] = await db
      .select({ id: userBlocks.id })
      .from(userBlocks)
      .where(or(
        and(eq(userBlocks.blockerId, user.sub), eq(userBlocks.blockedId, event.organizerId)),
        and(eq(userBlocks.blockerId, event.organizerId), eq(userBlocks.blockedId, user.sub)),
      ))
      .limit(1)
    if (blockRow) return NextResponse.json({ error: 'BLOCKED' }, { status: 403 })

    // Idempotent — if already attending return 200
    const existing = await queryUserRsvp(eventId, user.sub)
    if (existing?.status === 'attending') {
      return NextResponse.json({ data: { status: 'attending' } })
    }

    // Capacity guard is folded into the write so the check+write is atomic.
    // If maxCapacity is null the subquery evaluates to TRUE (no limit).
    const capacityOk = event.maxCapacity !== null
      ? sql`(SELECT COUNT(*) FROM event_attendees WHERE event_id = ${eventId}::uuid AND status = 'attending') < ${event.maxCapacity}`
      : sql`TRUE`

    let attendee: typeof eventAttendees.$inferSelect | undefined

    if (existing) {
      // Re-attending after cancelling — atomic capacity-guarded UPDATE
      const result = await db.execute<typeof eventAttendees.$inferSelect>(
        sql`UPDATE event_attendees
            SET status = 'attending'
            WHERE id = ${existing.id}::uuid
              AND (${capacityOk})
            RETURNING *`
      )
      attendee = result.rows[0]
    } else {
      // New attendee — atomic capacity-guarded INSERT
      const result = await db.execute<typeof eventAttendees.$inferSelect>(
        sql`INSERT INTO event_attendees (event_id, user_id)
            SELECT ${eventId}::uuid, ${user.sub}::uuid
            WHERE (${capacityOk})
            RETURNING *`
      )
      attendee = result.rows[0]
    }

    if (!attendee) {
      return NextResponse.json({ error: 'EVENT_FULL' }, { status: 409 })
    }

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

export const DELETE = requireAuthWithRateLimit(async (req: NextRequest, { user, params }) => {
  try {
    const ip = getClientIp(req)

    const eventId = params.id
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
