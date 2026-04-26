import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { toolReservations, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireAuth } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { patchToolReservationSchema } from '@/lib/schemas/tool-reservation'
import { uuidSchema } from '@/lib/schemas/skill'
import { queueNotification } from '@/lib/notifications'

const TERMINAL = ['rejected', 'returned', 'cancelled']

// ─── PATCH /api/tool-reservations/[id] — state machine ──────────────────────

export const PATCH = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').at(-1)!
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const body = await req.json().catch(() => null)
    const parsed = patchToolReservationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const [existing, dbUser] = await Promise.all([
      db.query.toolReservations.findFirst({ where: eq(toolReservations.id, id) }),
      db.query.users.findFirst({ where: eq(users.id, user.sub) }),
    ])
    if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (!dbUser || dbUser.deletedAt) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

    const isOwner    = existing.ownerId    === user.sub
    const isBorrower = existing.borrowerId === user.sub
    if (!isOwner && !isBorrower) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

    if (TERMINAL.includes(existing.status)) {
      return NextResponse.json({ error: 'RESERVATION_ALREADY_TERMINAL' }, { status: 422 })
    }

    const { action, cancellationReason } = parsed.data
    const now = new Date()

    // State machine rules
    if (action === 'approve' || action === 'reject') {
      if (!isOwner) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
      if (existing.status !== 'pending') return NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 422 })
    }

    if (action === 'return') {
      if (!isBorrower) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
      if (existing.status !== 'approved') return NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 422 })
    }

    if (action === 'cancel') {
      if (existing.status === 'pending' && !isBorrower) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
      }
      if (!['pending', 'approved'].includes(existing.status)) {
        return NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 422 })
      }
    }

    // Map action → status + notification
    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject:  'rejected',
      return:  'returned',
      cancel:  'cancelled',
    }
    const notifTypeMap: Record<string, string> = {
      approve: 'reservation_approved',
      reject:  'reservation_rejected',
      return:  'reservation_returned',
      cancel:  'reservation_cancelled',
    }

    const updates = {
      status:             statusMap[action] as (typeof toolReservations.$inferInsert)['status'],
      updatedAt:          now,
      ...(action === 'cancel' && {
        cancellationReason: cancellationReason ?? null,
        cancelledById:      user.sub,
      }),
    }

    const [updated] = await db
      .update(toolReservations)
      .set(updates)
      .where(eq(toolReservations.id, id))
      .returning()

    // Notify the other party
    const recipient = isOwner ? existing.borrowerId : existing.ownerId
    queueNotification({ userId: recipient, type: notifTypeMap[action], entityType: 'tool_reservation', entityId: id })

    await writeAuditLog({
      userId:    user.sub,
      userEmail: user.email,
      action:    'update',
      entity:    'tool_reservations',
      entityId:  id,
      ipAddress: ip,
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PATCH /api/tool-reservations/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
