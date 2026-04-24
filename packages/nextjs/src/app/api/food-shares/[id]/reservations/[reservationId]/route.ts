import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { foodShares, foodReservations, notifications, users } from '@/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { requireAuth, getClientIp } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { updateFoodReservationSchema } from '@/lib/schemas/food'
import { queryFoodReservationUsage } from '@/lib/queries/food'
import { createNotification } from '@/lib/create-notification'

type Ctx = { params: Promise<{ id: string; reservationId: string }> }

function extractIds(url: string): { foodShareId: string; reservationId: string } {
  const parts = new URL(url).pathname.split('/').filter(Boolean)
  return {
    foodShareId: parts.at(-3) ?? '',
    reservationId: parts.at(-1) ?? '',
  }
}

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

export const PATCH = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const { foodShareId, reservationId } = extractIds(req.url)
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

    const body = await req.json().catch(() => null)
    const parsed = updateFoodReservationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    if (parsed.data.action === 'approve' || parsed.data.action === 'reject') {
      if (!isOwner) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
      if (reservation.status !== 'pending') return NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 422 })
    }

    if (parsed.data.action === 'approve') {
      const { activeCount } = await queryFoodReservationUsage(foodShareId)
      if (activeCount >= foodShare.quantity) {
        return NextResponse.json({ error: 'FOOD_NOT_AVAILABLE' }, { status: 422 })
      }
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

    const [updated] = await db.update(foodReservations).set(updates).where(eq(foodReservations.id, reservationId)).returning()
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
    }).catch(() => {})

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
