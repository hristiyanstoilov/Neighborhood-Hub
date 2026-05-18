import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { tools, categories, locations, profiles } from '@/db/schema'
import { eq, and, desc, count } from 'drizzle-orm'
import { apiRatelimit, createRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireVerifiedAuthWithRateLimit } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { checkAndAwardBadges } from '@/lib/badges'
import { createToolSchema, listToolsSchema } from '@/lib/schemas/tool'
import { buildToolConditions, toolSelect } from '@/lib/queries/tools'
import { createFeedEvent } from '@/lib/create-feed-event'
import { validateForeignKey } from '@/lib/db-helpers'

// ─── GET /api/tools — public listing ────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(ip)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const { searchParams } = new URL(req.url)
    const parsed = listToolsSchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { categoryId, locationId, status, search, page, limit } = parsed.data
    const conditions = buildToolConditions({ categoryId, locationId, status, search })

    const [rows, [{ total }]] = await Promise.all([
      db
        .select(toolSelect)
        .from(tools)
        .leftJoin(profiles,   eq(profiles.userId,   tools.ownerId))
        .leftJoin(categories, eq(categories.id,      tools.categoryId))
        .leftJoin(locations,  eq(locations.id,       tools.locationId))
        .where(and(...conditions))
        .limit(limit)
        .offset((page - 1) * limit)
        .orderBy(desc(tools.createdAt)),
      db.select({ total: count() }).from(tools).where(and(...conditions)),
    ])

    return NextResponse.json(
      { data: rows, page, limit, total },
      { headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=60' } }
    )
  } catch (err) {
    console.error('[GET /api/tools]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// ─── POST /api/tools — create ────────────────────────────────────────────────

export const POST = requireVerifiedAuthWithRateLimit(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)
    const { success: createOk } = await createRatelimit.limit(user.sub)
    if (!createOk) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const body = await req.json().catch(() => null)
    if (body === null) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
    const parsed = createToolSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { title, description, categoryId, locationId, condition, imageUrl } = parsed.data

    const catErr = await validateForeignKey(categories, categoryId, 'CATEGORY_NOT_FOUND')
    if (catErr) return NextResponse.json({ error: catErr.error }, { status: catErr.status })

    const locErr = await validateForeignKey(locations, locationId, 'LOCATION_NOT_FOUND')
    if (locErr) return NextResponse.json({ error: locErr.error }, { status: locErr.status })

    const [tool] = await db.insert(tools).values({
      ownerId:     user.sub,
      title,
      description: description ?? null,
      categoryId:  categoryId ?? null,
      locationId:  locationId ?? null,
      condition:   condition ?? null,
      imageUrl:    imageUrl ?? null,
    }).returning()

    await writeAuditLog({
      userId:    user.sub,
      userEmail: user.email,
      action:    'create',
      entity:    'tools',
      entityId:  tool.id,
      ipAddress: ip,
    })

    void createFeedEvent({
      actorId:    user.sub,
      eventType:  'tool_listed',
      targetId:   tool.id,
      targetTitle: tool.title,
      targetUrl:  `/tools/${tool.id}`,
    }).catch((e) => console.error('[side-effect]', e))

    void checkAndAwardBadges(user.sub).catch((e) => console.error('[side-effect]', e))

    return NextResponse.json({ data: tool }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/tools]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
