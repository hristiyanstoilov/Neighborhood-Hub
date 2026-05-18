import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { toolReservations, tools } from '@/db/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'
import { getClientIp, requireAuthWithRateLimit, requireVerifiedAuthWithRateLimit } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { createToolReservationSchema } from '@/lib/schemas/tool-reservation'
import { queryToolReservationsForUser } from '@/lib/queries/tool-reservations'
import { isBlocked } from '@/lib/queries/blocks'
import { z } from 'zod'
import { createNotification } from '@/lib/create-notification'
import { isUniqueViolation } from '@/lib/db-errors'

// ─── GET /api/tool-reservations — my reservations ───────────────────────────

export const GET = requireAuthWithRateLimit(async (req: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role') === 'owner' ? 'owner' : 'borrower'

    const rawLimit = parseInt(searchParams.get('limit') ?? '20', 10)
    const rawOffset = parseInt(searchParams.get('offset') ?? '0', 10)
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 20
    const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0

    const rows = await queryToolReservationsForUser(user.sub, role, limit, offset)
    return NextResponse.json({ data: rows, limit, offset })
  } catch (err) {
    console.error('[GET /api/tool-reservations]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

// ─── POST /api/tool-reservations — create ───────────────────────────────────

export const POST = requireVerifiedAuthWithRateLimit(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)

    const body = await req.json().catch(() => null)
    if (body === null) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
    const parsed = createToolReservationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { toolId, startDate, endDate, notes, returnBy } = parsed.data

    const tool = await db.query.tools.findFirst({
      where: and(eq(tools.id, toolId), isNull(tools.deletedAt)),
    })
    if (!tool) return NextResponse.json({ error: 'TOOL_NOT_FOUND' }, { status: 404 })
    if (tool.ownerId === user.sub) return NextResponse.json({ error: 'CANNOT_RESERVE_OWN_TOOL' }, { status: 422 })
    if (tool.status !== 'available') return NextResponse.json({ error: 'TOOL_NOT_AVAILABLE' }, { status: 422 })

    if (await isBlocked(user.sub, tool.ownerId)) return NextResponse.json({ error: 'BLOCKED' }, { status: 403 })

    const start = new Date(startDate)
    const end   = new Date(endDate)
    if (end <= start) return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })

    // Atomic INSERT: only inserts if no overlapping pending/approved reservation exists.
    // A separate SELECT+INSERT would have a TOCTOU race under concurrent requests.
    const newId = crypto.randomUUID()
    let reservation: typeof toolReservations.$inferSelect | undefined
    try {
      const result = await db.execute(sql`
        INSERT INTO tool_reservations (id, tool_id, borrower_id, owner_id, start_date, end_date, notes, return_by)
        SELECT ${newId}::uuid, ${toolId}::uuid, ${user.sub}::uuid, ${tool.ownerId}::uuid,
               ${start}::timestamptz, ${end}::timestamptz, ${notes ?? null}::text, ${returnBy ? new Date(returnBy) : null}::timestamptz
        WHERE NOT EXISTS (
          SELECT 1 FROM tool_reservations
          WHERE tool_id   = ${toolId}::uuid
            AND status    IN ('pending', 'approved')
            AND start_date < ${end}::timestamptz
            AND end_date   > ${start}::timestamptz
        )
        RETURNING id
      `)
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'DATE_CONFLICT' }, { status: 409 })
      }
      // Re-fetch via Drizzle to get the camelCase-mapped row that clients expect
      ;[reservation] = await db.select().from(toolReservations).where(eq(toolReservations.id, newId))
    } catch (err: unknown) {
      if (isUniqueViolation(err, 'tool_reservations_active_idx')) {
        return NextResponse.json({ error: 'DUPLICATE_RESERVATION' }, { status: 409 })
      }
      throw err
    }

    if (!reservation) {
      console.error('[POST /api/tool-reservations] re-fetch returned no row for id', newId)
      return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
    }

    // Notify owner
    void createNotification({
      userId: tool.ownerId,
      type: 'reservation_new',
      entityType: 'tool_reservation',
      entityId: reservation.id,
    }).catch((e) => console.error('[side-effect]', e))

    await writeAuditLog({
      userId:    user.sub,
      userEmail: user.email,
      action:    'create',
      entity:    'tool_reservations',
      entityId:  reservation.id,
      ipAddress: ip,
    })

    return NextResponse.json({ data: reservation }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/tool-reservations]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
