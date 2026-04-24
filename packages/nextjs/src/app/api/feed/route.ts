import { NextRequest, NextResponse } from 'next/server'
import { count, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { feedEvents, profiles } from '@/db/schema'
import { getClientIp, requireAuth } from '@/lib/middleware'
import { apiRatelimit, feedPublicRatelimit } from '@/lib/ratelimit'
import { createFeedSchema, listFeedSchema } from '@/lib/schemas/feed'

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const { success } = await feedPublicRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const { searchParams } = new URL(req.url)
    const parsed = listFeedSchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { limit, offset } = parsed.data

    const [items, [{ total }]] = await Promise.all([
      db
        .select({
          id: feedEvents.id,
          actorName: feedEvents.actorName,
          eventType: feedEvents.eventType,
          targetTitle: feedEvents.targetTitle,
          targetUrl: feedEvents.targetUrl,
          createdAt: feedEvents.createdAt,
        })
        .from(feedEvents)
        .orderBy(desc(feedEvents.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(feedEvents),
    ])

    return NextResponse.json({ data: { items, total } })
  } catch (err) {
    console.error('[GET /api/feed]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export const POST = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const body = await req.json().catch(() => null)
    const parsed = createFeedSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const actorProfile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, user.sub),
      columns: { name: true, isPublic: true },
    })

    const actorName = actorProfile?.name ?? 'Neighbor'

    const [event] = await db
      .insert(feedEvents)
      .values({
        actorId: user.sub,
        actorName,
        eventType: parsed.data.eventType,
        targetId: parsed.data.targetId,
        targetTitle: parsed.data.targetTitle,
        targetUrl: parsed.data.targetUrl,
      })
      .returning({ id: feedEvents.id })

    return NextResponse.json({ data: { id: event.id } }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/feed]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
