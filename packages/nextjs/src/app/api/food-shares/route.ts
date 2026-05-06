import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { foodShares } from '@/db/schema'
import { and, count, isNull } from 'drizzle-orm'
import { apiRatelimit, createRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireAuth, requireVerifiedAuth } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { checkAndAwardBadges } from '@/lib/badges'
import { createFoodShareSchema, listFoodSharesSchema } from '@/lib/schemas/food'
import { buildFoodShareConditions, queryFoodShares } from '@/lib/queries/food'
import { eq } from 'drizzle-orm'
import { createFeedEvent } from '@/lib/create-feed-event'

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

export const POST = requireVerifiedAuth(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    const { success: createOk } = await createRatelimit.limit(user.sub)
    if (!createOk) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const body = await req.json().catch(() => null)
    if (body === null) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
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

    void checkAndAwardBadges(user.sub).catch(() => undefined)

    void createFeedEvent({
      actorId:    user.sub,
      eventType:  'food_shared',
      targetId:   foodShare.id,
      targetTitle: foodShare.title,
      targetUrl:  `/food/${foodShare.id}`,
    }).catch(() => undefined)

    return NextResponse.json({ data: foodShare }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/food-shares]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})