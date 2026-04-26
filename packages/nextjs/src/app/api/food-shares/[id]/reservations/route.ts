import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { foodShares, foodReservations, notifications, users } from '@/db/schema'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { requireAuth } from '@/lib/middleware'
import { createFoodReservationSchema } from '@/lib/schemas/food'
import { queryFoodReservations } from '@/lib/queries/food'
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

    // Atomic check-and-insert: the CTE reads the active count and inserts only if a slot is free,
    // preventing the TOCTOU race where two concurrent requests both pass a pre-insert count check.
    const cteResult = await db.execute<{ id: string }>(sql`
      WITH available AS (
        SELECT 1
        FROM food_shares fs
        WHERE fs.id = ${foodShareId}
          AND fs.deleted_at IS NULL
          AND (
            SELECT COUNT(*) FROM food_reservations fr
            WHERE fr.food_share_id = ${foodShareId}
              AND fr.status IN ('reserved', 'picked_up')
          ) < fs.quantity
      ),
      inserted AS (
        INSERT INTO food_reservations (id, food_share_id, requester_id, owner_id, pickup_at, notes)
        SELECT
          gen_random_uuid(),
          ${foodShareId},
          ${user.sub},
          ${foodShare.ownerId},
          ${new Date(parsed.data.pickupAt).toISOString()}::timestamptz,
          ${parsed.data.notes ?? null}
        FROM available
        RETURNING id
      )
      SELECT id FROM inserted
    `)

    if (cteResult.rows.length === 0) {
      return NextResponse.json({ error: 'FOOD_NOT_AVAILABLE' }, { status: 422 })
    }

    const reservation = await db.query.foodReservations.findFirst({
      where: eq(foodReservations.id, cteResult.rows[0].id),
    })
    if (!reservation) return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })

    db.insert(notifications).values({
      userId: foodShare.ownerId,
      type: 'food_reservation_new',
      entityType: 'food_reservation',
      entityId: reservation.id,
    }).catch((e) => console.error('[POST /api/food-shares/[id]/reservations] notification insert failed', e))

    return NextResponse.json({ data: reservation }, { status: 201 })
  } catch (err) {
    if (isUniqueViolation(err, 'food_reservations_active_idx')) {
      return NextResponse.json({ error: 'DUPLICATE_ACTIVE_RESERVATION' }, { status: 409 })
    }
    console.error('[POST /api/food-shares/[id]/reservations]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})