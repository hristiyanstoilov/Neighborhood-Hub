import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { toolReservations, tools, userBlocks } from '@/db/schema'
import { eq, and, isNull, or } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireAuth, requireVerifiedAuth } from '@/lib/middleware'
import { createToolReservationSchema } from '@/lib/schemas/tool-reservation'
import { queryToolReservationsForUser } from '@/lib/queries/tool-reservations'
import { z } from 'zod'
import { createNotification } from '@/lib/create-notification'
import { isUniqueViolation } from '@/lib/db-errors'

// ─── GET /api/tool-reservations — my reservations ───────────────────────────

export const GET = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role') === 'owner' ? 'owner' : 'borrower'

    const rows = await queryToolReservationsForUser(user.sub, role)
    return NextResponse.json({ data: rows })
  } catch (err) {
    console.error('[GET /api/tool-reservations]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

// ─── POST /api/tool-reservations — create ───────────────────────────────────

export const POST = requireVerifiedAuth(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const body = await req.json().catch(() => null)
    if (body === null) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
    const parsed = createToolReservationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { toolId, startDate, endDate, notes } = parsed.data

    const tool = await db.query.tools.findFirst({
      where: and(eq(tools.id, toolId), isNull(tools.deletedAt)),
    })
    if (!tool) return NextResponse.json({ error: 'TOOL_NOT_FOUND' }, { status: 404 })
    if (tool.ownerId === user.sub) return NextResponse.json({ error: 'CANNOT_RESERVE_OWN_TOOL' }, { status: 422 })
    if (tool.status !== 'available') return NextResponse.json({ error: 'TOOL_NOT_AVAILABLE' }, { status: 422 })

    const [blockRow] = await db
      .select({ id: userBlocks.id })
      .from(userBlocks)
      .where(or(
        and(eq(userBlocks.blockerId, user.sub), eq(userBlocks.blockedId, tool.ownerId)),
        and(eq(userBlocks.blockerId, tool.ownerId), eq(userBlocks.blockedId, user.sub)),
      ))
      .limit(1)
    if (blockRow) return NextResponse.json({ error: 'BLOCKED' }, { status: 403 })

    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end < start) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })

    let reservation
    try {
      ;[reservation] = await db.insert(toolReservations).values({
        toolId,
        borrowerId: user.sub,
        ownerId:    tool.ownerId,
        startDate:  start,
        endDate:    end,
        notes:      notes ?? null,
      }).returning()
    } catch (err: unknown) {
      // Unique index: borrower already has an active (pending/approved) reservation for this tool
      if (isUniqueViolation(err, 'tool_reservations_active_idx')) {
        return NextResponse.json({ error: 'DUPLICATE_RESERVATION' }, { status: 409 })
      }
      throw err
    }

    // Notify owner
    void createNotification({
      userId: tool.ownerId,
      type: 'reservation_new',
      entityType: 'tool_reservation',
      entityId: reservation.id,
    }).catch(() => {})

    return NextResponse.json({ data: reservation }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/tool-reservations]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
