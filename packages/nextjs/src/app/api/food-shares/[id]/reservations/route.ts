import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { foodShares, foodReservations, notifications, users } from '@/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { requireAuth } from '@/lib/middleware'
import { createFoodReservationSchema } from '@/lib/schemas/food'
import { queryFoodReservationUsage, queryFoodReservations } from '@/lib/queries/food'
import { createNotification } from '@/lib/create-notification'

type Ctx = { params: Promise<{ id: string }> }

function extractFoodShareId(url: string): string {
  const parts = new URL(url).pathname.split('/').filter(Boolean)
  return parts.at(-2) ?? ''
}

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

    const { activeCount } = await queryFoodReservationUsage(foodShareId)
    if (activeCount >= foodShare.quantity) return NextResponse.json({ error: 'FOOD_NOT_AVAILABLE' }, { status: 422 })

    const body = await req.json().catch(() => null)
    const parsed = createFoodReservationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const [reservation] = await db.insert(foodReservations).values({
      foodShareId,
      requesterId: user.sub,
      ownerId: foodShare.ownerId,
      pickupAt: new Date(parsed.data.pickupAt),
      notes: parsed.data.notes ?? null,
    }).returning()

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