import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { events, eventAttendees, notifications } from '@/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireAuth } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { updateEventSchema } from '@/lib/schemas/event'
import { queryEventById } from '@/lib/queries/events'

type Ctx = { params: Promise<{ id: string }> }

function extractId(url: string): string {
  return new URL(url).pathname.split('/').filter(Boolean).at(-1) ?? ''
}

// ─── GET /api/events/[id] — public detail ───────────────────────────────────

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(ip)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const { id } = await params
    const event = await queryEventById(id)
    if (!event) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return NextResponse.json({ data: event })
  } catch (err) {
    console.error('[GET /api/events/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// ─── PATCH /api/events/[id] — organizer edit / status change ────────────────

export const PATCH = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const id = extractId(req.url)
    const event = await db.query.events.findFirst({ where: and(eq(events.id, id), isNull(events.deletedAt)) })
    if (!event) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (event.organizerId !== user.sub) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

    const body = await req.json().catch(() => null)
    const parsed = updateEventSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    // Validate endsAt > startsAt when either is being updated
    const effectiveStartsAt = parsed.data.startsAt ? new Date(parsed.data.startsAt) : event.startsAt
    if (parsed.data.endsAt && new Date(parsed.data.endsAt) <= effectiveStartsAt) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: 'endsAt must be after startsAt' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() }
    if (parsed.data.startsAt) updates.startsAt = new Date(parsed.data.startsAt)
    if (parsed.data.endsAt)   updates.endsAt   = new Date(parsed.data.endsAt)

    const [updated] = await db.update(events).set(updates).where(eq(events.id, id)).returning()

    // Notify attendees if organizer cancels the event
    if (parsed.data.status === 'cancelled') {
      const attendees = await db
        .select({ userId: eventAttendees.userId })
        .from(eventAttendees)
        .where(and(eq(eventAttendees.eventId, id), eq(eventAttendees.status, 'attending')))

      if (attendees.length > 0) {
        db.insert(notifications).values(
          attendees.map((a) => ({
            userId:     a.userId,
            type:       'event_cancelled' as const,
            entityType: 'event',
            entityId:   id,
          }))
        ).catch(() => {})
      }
    }

    await writeAuditLog({ userId: user.sub, userEmail: user.email, action: 'update', entity: 'events', entityId: id, ipAddress: ip })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PATCH /api/events/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

// ─── DELETE /api/events/[id] — soft delete ───────────────────────────────────

export const DELETE = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const id = extractId(req.url)
    const event = await db.query.events.findFirst({ where: and(eq(events.id, id), isNull(events.deletedAt)) })
    if (!event) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (event.organizerId !== user.sub) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

    await db.update(events).set({ deletedAt: new Date() }).where(eq(events.id, id))
    await writeAuditLog({ userId: user.sub, userEmail: user.email, action: 'delete', entity: 'events', entityId: id, ipAddress: ip })

    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    console.error('[DELETE /api/events/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
