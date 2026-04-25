import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { toolReservations, tools, users } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireAuth } from '@/lib/middleware'
import { createToolReservationSchema } from '@/lib/schemas/tool-reservation'
import { queryToolReservationsForUser } from '@/lib/queries/tool-reservations'
import { z } from 'zod'
import { createNotification } from '@/lib/create-notification'

function isUniqueViolation(err: unknown, indexHint: string): boolean {
  const visited = new Set<unknown>()
  const queue: unknown[] = [err]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || visited.has(current)) continue
    visited.add(current)

    if (typeof current === 'object') {
      const obj = current as { code?: unknown; message?: unknown; cause?: unknown }
      if (typeof obj.code === 'string' && obj.code === '23505') return true

      const message = typeof obj.message === 'string' ? obj.message.toLowerCase() : ''
      if (message.includes(indexHint.toLowerCase()) || message.includes('duplicate key value')) return true

      if ('cause' in obj) queue.push(obj.cause)
    }

    if (current instanceof Error && current.cause) {
      queue.push(current.cause)
    }
  }

  return false
}

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

export const POST = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.sub) })
    if (!dbUser?.emailVerifiedAt) {
      return NextResponse.json({ error: 'UNVERIFIED_EMAIL' }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
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
