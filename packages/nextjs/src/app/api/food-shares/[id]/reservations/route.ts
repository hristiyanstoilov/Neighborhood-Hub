import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { foodShares, foodReservations, userBlocks } from '@/db/schema'
import { and, eq, isNull, or, sql } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { requireAuth, requireVerifiedAuth } from '@/lib/middleware'
import { createFoodReservationSchema } from '@/lib/schemas/food'
import { queryFoodReservations } from '@/lib/queries/food'
import { createNotification } from '@/lib/create-notification'
import { isUniqueViolation } from '@/lib/db-errors'

type Ctx = { params: Promise<{ id: string }> }

export const GET = requireAuth(async (req: NextRequest, { user, params }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const foodShareId = params.id
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

export const POST = requireVerifiedAuth(async (req: NextRequest, { user, params }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const foodShareId = params.id
    const foodShare = await db.query.foodShares.findFirst({ where: and(eq(foodShares.id, foodShareId), isNull(foodShares.deletedAt)) })
    if (!foodShare) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (foodShare.ownerId === user.sub) return NextResponse.json({ error: 'CANNOT_RESERVE_OWN_FOOD' }, { status: 422 })

    const [blockRow] = await db
      .select({ id: userBlocks.id })
      .from(userBlocks)
      .where(or(
        and(eq(userBlocks.blockerId, user.sub), eq(userBlocks.blockedId, foodShare.ownerId)),
        and(eq(userBlocks.blockerId, foodShare.ownerId), eq(userBlocks.blockedId, user.sub)),
      ))
      .limit(1)
    if (blockRow) return NextResponse.json({ error: 'BLOCKED' }, { status: 403 })

    const body = await req.json().catch(() => null)
    if (body === null) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
    const parsed = createFoodReservationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    // Capacity guard is folded into the INSERT so the check+write is atomic.
    // Active statuses that consume a slot are 'reserved' and 'picked_up'.
    const pickupAt = new Date(parsed.data.pickupAt)
    const notes    = parsed.data.notes ?? null
    const result = await db.execute<{ id: string }>(
      sql`INSERT INTO food_reservations (food_share_id, requester_id, owner_id, pickup_at, notes)
          SELECT ${foodShareId}::uuid, ${user.sub}::uuid, ${foodShare.ownerId}::uuid, ${pickupAt}, ${notes}
          WHERE (
            SELECT COUNT(*) FILTER (WHERE status IN ('reserved', 'picked_up'))
            FROM food_reservations
            WHERE food_share_id = ${foodShareId}::uuid
          ) < ${foodShare.quantity}
          RETURNING id`
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'FOOD_NOT_AVAILABLE' }, { status: 422 })
    }

    // Re-fetch via ORM to get properly-named camelCase columns (raw execute returns snake_case)
    const [reservation] = await db.select().from(foodReservations).where(eq(foodReservations.id, result.rows[0].id))

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
