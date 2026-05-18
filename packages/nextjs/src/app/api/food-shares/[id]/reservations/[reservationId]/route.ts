import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { foodShares, foodReservations, users } from '@/db/schema'
import { and, eq, inArray, isNull, sql } from 'drizzle-orm'
import { requireAuthWithRateLimit, getClientIp } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { updateFoodReservationSchema } from '@/lib/schemas/food'
import { queryFoodReservationUsage } from '@/lib/queries/food'
import { createNotification } from '@/lib/create-notification'
import { sendFoodReservationApproved, sendFoodPickedUp } from '@/lib/email'

type Ctx = { params: Promise<{ id: string; reservationId: string }> }

async function syncFoodShareStatus(foodShareId: string, quantity: number) {
  const { activeCount, pickedUpCount } = await queryFoodReservationUsage(foodShareId)

  const nextStatus =
    activeCount === 0
      ? 'available'
      : pickedUpCount >= quantity
        ? 'picked_up'
        : activeCount >= quantity
          ? 'reserved'
          : 'available'

  await db.update(foodShares).set({ status: nextStatus, updatedAt: new Date() }).where(eq(foodShares.id, foodShareId))
}

export const PATCH = requireAuthWithRateLimit(async (req: NextRequest, { user, params }) => {
  try {
    const ip = getClientIp(req)

    const foodShareId = params.id
    const reservationId = params.reservationId
    const [foodShare, reservation, dbUser] = await Promise.all([
      db.query.foodShares.findFirst({ where: and(eq(foodShares.id, foodShareId), isNull(foodShares.deletedAt)) }),
      db.query.foodReservations.findFirst({ where: and(eq(foodReservations.id, reservationId), eq(foodReservations.foodShareId, foodShareId)) }),
      db.query.users.findFirst({ where: eq(users.id, user.sub) }),
    ])

    if (!foodShare || !reservation) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (!dbUser || dbUser.deletedAt) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

    const isOwner = foodShare.ownerId === user.sub
    const isRequester = reservation.requesterId === user.sub
    if (!isOwner && !isRequester) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

    const TERMINAL_STATUSES = ['picked_up', 'rejected', 'cancelled']
    if (TERMINAL_STATUSES.includes(reservation.status)) {
      return NextResponse.json({ error: 'RESERVATION_ALREADY_TERMINAL' }, { status: 422 })
    }

    const body = await req.json().catch(() => null)
    if (body === null) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
    const parsed = updateFoodReservationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    if (parsed.data.action === 'approve' || parsed.data.action === 'reject') {
      if (!isOwner) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
      if (reservation.status !== 'pending') return NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 422 })
    }

    if (parsed.data.action === 'picked_up') {
      if (!isOwner) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
      if (reservation.status !== 'reserved') return NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 422 })
    }

    if (parsed.data.action === 'cancel') {
      if (!['pending', 'reserved'].includes(reservation.status)) return NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 422 })
      if (!isOwner && !isRequester) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    const statusMap: Record<string, 'reserved' | 'rejected' | 'cancelled' | 'picked_up'> = {
      approve: 'reserved',
      reject: 'rejected',
      cancel: 'cancelled',
      picked_up: 'picked_up',
    }

    const updates: Record<string, unknown> = {
      status: statusMap[parsed.data.action],
      updatedAt: new Date(),
    }

    if (parsed.data.action === 'cancel') {
      updates.cancellationReason = parsed.data.cancellationReason ?? null
      updates.cancelledById = user.sub
    }

    if (parsed.data.action === 'picked_up') {
      updates.pickedUpAt = new Date()
    }

    // For 'approve': embed the quantity check atomically in the WHERE clause so
    // two concurrent approvals cannot both succeed when quantity=1.
    const whereClause =
      parsed.data.action === 'approve'
        ? and(
            eq(foodReservations.id, reservationId),
            sql`(
              SELECT COUNT(*) FROM food_reservations
              WHERE food_share_id = ${foodShareId}
              AND status IN ('reserved', 'picked_up')
            ) < ${foodShare.quantity}`
          )
        : eq(foodReservations.id, reservationId)

    const [updated] = await db.update(foodReservations).set(updates).where(whereClause).returning()

    if (!updated) {
      // Concurrent approval consumed the last slot between our read and write
      return NextResponse.json({ error: 'FOOD_NOT_AVAILABLE' }, { status: 422 })
    }

    // Post-approve compensation: under READ COMMITTED two concurrent approvals can
    // both pass the WHERE-clause subquery before either commits. Re-count after
    // our commit and roll back if we pushed reserved count over capacity.
    if (parsed.data.action === 'approve') {
      const [{ reservedCount }] = await db
        .select({ reservedCount: sql<number>`COUNT(*)::int` })
        .from(foodReservations)
        .where(and(
          eq(foodReservations.foodShareId, foodShareId),
          inArray(foodReservations.status, ['reserved', 'picked_up']),
        ))

      if (reservedCount > foodShare.quantity) {
        // Guard on status='reserved' so a concurrent cancel in the same window
        // is not accidentally un-done by this rollback (0-row UPDATE is safe).
        await db
          .update(foodReservations)
          .set({ status: 'pending', updatedAt: new Date() })
          .where(and(eq(foodReservations.id, reservationId), eq(foodReservations.status, 'reserved')))
        return NextResponse.json({ error: 'FOOD_NOT_AVAILABLE' }, { status: 422 })
      }
    }

    await syncFoodShareStatus(foodShareId, foodShare.quantity)

    const recipient = isOwner ? reservation.requesterId : foodShare.ownerId
    const typeMap: Record<string, 'food_reservation_approved' | 'food_reservation_rejected' | 'food_reservation_cancelled' | 'food_reservation_picked_up'> = {
      approve: 'food_reservation_approved',
      reject: 'food_reservation_rejected',
      cancel: 'food_reservation_cancelled',
      picked_up: 'food_reservation_picked_up',
    }

    void createNotification({
      userId: recipient,
      type: typeMap[parsed.data.action],
      entityType: 'food_reservation',
      entityId: reservationId,
    }).catch((e) => console.error('[side-effect]', e))

    // Send email notifications for key transitions
    if (parsed.data.action === 'approve') {
      const requesterUser = await db.query.users.findFirst({
        where: eq(users.id, reservation.requesterId),
        columns: { email: true },
      })
      if (requesterUser) {
        void sendFoodReservationApproved({
          to: requesterUser.email,
          foodTitle: foodShare.title,
          pickupAt: reservation.pickupAt,
        }).catch((e) => console.error('[side-effect]', e))
      }
    }

    if (parsed.data.action === 'picked_up') {
      const requesterUser = await db.query.users.findFirst({
        where: eq(users.id, reservation.requesterId),
        columns: { email: true },
      })
      if (requesterUser) {
        void sendFoodPickedUp({
          to: requesterUser.email,
          foodTitle: foodShare.title,
        }).catch((e) => console.error('[side-effect]', e))
      }
    }

    await writeAuditLog({
      userId: user.sub,
      userEmail: user.email,
      action: 'update',
      entity: 'food_reservations',
      entityId: reservationId,
      ipAddress: ip ?? undefined,
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PATCH /api/food-shares/[id]/reservations/[reservationId]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
