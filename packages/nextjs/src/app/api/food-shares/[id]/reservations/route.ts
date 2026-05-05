import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { foodShares, foodReservations, users } from '@/db/schema'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { requireAuth } from '@/lib/middleware'
import { createFoodReservationSchema } from '@/lib/schemas/food'
import { queryFoodReservations } from '@/lib/queries/food'
import { createNotification } from '@/lib/create-notification'
import { isUniqueViolation } from '@/lib/db-errors'

type Ctx = { params: Promise<{ id: string }> }

function extractFoodShareId(url: string): string {
  const parts = new URL(url).pathname.split('/').filter(Boolean)
  return parts.at(-2) ?? ''
}

export const GET = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const foodShareId = extractFoodShareId(req.url)
    const foodShare = await db.query.foodShares.findFirst({ where: and(eq(foodShares.id, foodShareId), isNull(foodShares.deletedAt)) })
    if (!foodShare) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    const canSeeAll = foodShare.ownerId === user.sub
    const rows = await queryFoodReservations(foodShareId)
    return NextResponse.json({ data: canSeeAll ? rows : rows.filter((row) => row.requesterId === user.sub) })
  } catch (err) {
    console.error('[GET /api/food-shares/[id]/reservations]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

export const POST = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.sub) })
    if (!dbUser?.emailVerifiedAt) {
      return NextResponse.json({ error: 'UNVERIFIED_EMAIL' }, { status: 403 })
    }

    const foodShareId = extractFoodShareId(req.url)
    const foodShare = await db.query.foodShares.findFirst({ where: and(eq(foodShares.id, foodShareId), isNull(foodShares.deletedAt)) })
    if (!foodShare) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (foodShare.ownerId === user.sub) return NextResponse.json({ error: 'CANNOT_RESERVE_OWN_FOOD' }, { status: 422 })

    const body = await req.json().catch(() => null)
    const parsed = createFoodReservationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    // Capacity guard is folded into the INSERT so the check+write is atomic.
    // Active statuses that consume a slot are 'reserved' and 'picked_up'.
    const pickupAt = new Date(parsed.data.pickupAt)
    const notes    = parsed.data.notes ?? null
    const result = await db.execute<typeof foodReservations.$inferSelect>(
      sql`INSERT INTO food_reservations (food_share_id, requester_id, owner_id, pickup_at, notes)
          SELECT ${foodShareId}::uuid, ${user.sub}::uuid, ${foodShare.ownerId}::uuid, ${pickupAt}, ${notes}
          WHERE (
            SELECT COUNT(*) FILTER (WHERE status IN ('reserved', 'picked_up'))
            FROM food_reservations
            WHERE food_share_id = ${foodShareId}::uuid
          ) < ${foodShare.quantity}
          RETURNING *`
    )

    const reservation = result.rows[0]
    if (!reservation) {
      return NextResponse.json({ error: 'FOOD_NOT_AVAILABLE' }, { status: 422 })
    }

    void createNotification({
      userId: foodShare.ownerId,
      type: 'food_reservation_new',
      entityType: 'food_reservation',
      entityId: reservation.id,
    }).catch(() => {})

    return NextResponse.json({ data: reservation }, { status: 201 })
  } catch (err) {
    if (isUniqueViolation(err, 'food_reservations_active_idx')) {
      return NextResponse.json({ error: 'DUPLICATE_ACTIVE_RESERVATION' }, { status: 409 })
    }
    console.error('[POST /api/food-shares/[id]/reservations]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})