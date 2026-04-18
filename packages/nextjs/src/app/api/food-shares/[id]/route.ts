import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { foodShares, foodReservations } from '@/db/schema'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireAuth } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { updateFoodShareSchema } from '@/lib/schemas/food'
import { queryFoodShareById } from '@/lib/queries/food'

type Ctx = { params: Promise<{ id: string }> }

function extractId(url: string): string {
  return new URL(url).pathname.split('/').filter(Boolean).at(-1) ?? ''
}

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(ip)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const { id } = await params
    const foodShare = await queryFoodShareById(id)
    if (!foodShare) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return NextResponse.json({ data: foodShare })
  } catch (err) {
    console.error('[GET /api/food-shares/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export const PATCH = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const id = extractId(req.url)
    const foodShare = await db.query.foodShares.findFirst({ where: and(eq(foodShares.id, id), isNull(foodShares.deletedAt)) })
    if (!foodShare) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (foodShare.ownerId !== user.sub) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

    const body = await req.json().catch(() => null)
    const parsed = updateFoodShareSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() }
    if (parsed.data.availableUntil !== undefined) {
      updates.availableUntil = parsed.data.availableUntil ? new Date(parsed.data.availableUntil) : null
    }

    const [updated] = await db.update(foodShares).set(updates).where(eq(foodShares.id, id)).returning()

    await writeAuditLog({ userId: user.sub, userEmail: user.email, action: 'update', entity: 'food_shares', entityId: id, ipAddress: ip })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PATCH /api/food-shares/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

export const DELETE = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const id = extractId(req.url)
    const foodShare = await db.query.foodShares.findFirst({ where: and(eq(foodShares.id, id), isNull(foodShares.deletedAt)) })
    if (!foodShare) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (foodShare.ownerId !== user.sub) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

    await db.update(foodShares).set({ deletedAt: new Date() }).where(eq(foodShares.id, id))
    await writeAuditLog({ userId: user.sub, userEmail: user.email, action: 'delete', entity: 'food_shares', entityId: id, ipAddress: ip })

    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    console.error('[DELETE /api/food-shares/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})