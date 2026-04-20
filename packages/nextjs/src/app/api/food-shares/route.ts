import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { foodShares, users } from '@/db/schema'
import { and, count, isNull } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireAuth } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { createFoodShareSchema, listFoodSharesSchema } from '@/lib/schemas/food'
import { buildFoodShareConditions, queryFoodShares } from '@/lib/queries/food'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(ip)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const { searchParams } = new URL(req.url)
    const parsed = listFoodSharesSchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { status, ownerId, limit, page } = parsed.data
    const conditions = buildFoodShareConditions({ status, ownerId })

    const [rows, [{ total }]] = await Promise.all([
      queryFoodShares({ status, ownerId, limit, page }),
      db.select({ total: count() }).from(foodShares).where(and(...conditions)),
    ])

    return NextResponse.json({ data: rows, page, limit, total })
  } catch (err) {
    console.error('[GET /api/food-shares]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

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
    const parsed = createFoodShareSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { title, description, quantity, locationId, availableUntil, pickupInstructions, imageUrl } = parsed.data

    const [foodShare] = await db.insert(foodShares).values({
      ownerId: user.sub,
      title,
      description: description ?? null,
      quantity,
      locationId: locationId ?? null,
      availableUntil: availableUntil ? new Date(availableUntil) : null,
      pickupInstructions: pickupInstructions ?? null,
      imageUrl: imageUrl ?? null,
    }).returning()

    await writeAuditLog({ userId: user.sub, userEmail: user.email, action: 'create', entity: 'food_shares', entityId: foodShare.id, ipAddress: ip })

    const authHeader = req.headers.get('authorization')
    if (authHeader) {
      void fetch(`${req.nextUrl.origin}/api/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          eventType: 'food_shared',
          targetId: foodShare.id,
          targetTitle: foodShare.title,
          targetUrl: `/food/${foodShare.id}`,
        }),
      }).catch(() => undefined)
    }

    return NextResponse.json({ data: foodShare }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/food-shares]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})