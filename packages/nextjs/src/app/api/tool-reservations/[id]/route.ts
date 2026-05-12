import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { toolReservations, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getClientIp, requireAuthWithRateLimit } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { ToolReservationStatus } from '@/lib/constants/statuses'
import { patchToolReservationSchema } from '@/lib/schemas/tool-reservation'
import { uuidSchema } from '@/lib/schemas/skill'
import { createNotification } from '@/lib/create-notification'

const TERMINAL: readonly string[] = [
  ToolReservationStatus.REJECTED,
  ToolReservationStatus.RETURNED,
  ToolReservationStatus.CANCELLED,
] as const
const CANCELLABLE_STATUSES: readonly string[] = [
  ToolReservationStatus.PENDING,
  ToolReservationStatus.APPROVED,
] as const

// ─── PATCH /api/tool-reservations/[id] — state machine ──────────────────────

export const PATCH = requireAuthWithRateLimit(async (req: NextRequest, { user, params }) => {
  try {
    const id = params.id
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const ip = getClientIp(req)

    const body = await req.json().catch(() => null)
    if (body === null) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
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
      if (existing.status !== ToolReservationStatus.PENDING) return NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 422 })
    }

    if (action === 'return') {
      if (!isBorrower) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
      if (existing.status !== ToolReservationStatus.APPROVED) return NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 422 })
    }

    if (action === 'cancel') {
      if (existing.status === ToolReservationStatus.PENDING && !isBorrower) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
      }
      if (!CANCELLABLE_STATUSES.includes(existing.status)) {
        return NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 422 })
      }
    }

    // Map action → status + notification
    const statusMap: Record<string, string> = {
      approve: ToolReservationStatus.APPROVED,
      reject:  ToolReservationStatus.REJECTED,
      return:  ToolReservationStatus.RETURNED,
      cancel:  ToolReservationStatus.CANCELLED,
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
    void createNotification({
      userId: recipient,
      type: notifTypeMap[action],
      entityType: 'tool_reservation',
      entityId: id,
    }).catch(() => {})

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
