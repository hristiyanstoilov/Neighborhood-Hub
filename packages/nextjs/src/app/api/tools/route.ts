import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { tools, categories, locations, users, profiles } from '@/db/schema'
import { eq, and, desc, count } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireAuth } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { createToolSchema, listToolsSchema } from '@/lib/schemas/tool'
import { buildToolConditions, toolSelect } from '@/lib/queries/tools'

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

    return NextResponse.json({ data: rows, page, limit, total })
  } catch (err) {
    console.error('[GET /api/tools]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// ─── POST /api/tools — create ────────────────────────────────────────────────

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
    const parsed = createToolSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { title, description, categoryId, locationId, condition, imageUrl } = parsed.data

    if (categoryId) {
      const cat = await db.query.categories.findFirst({ where: eq(categories.id, categoryId) })
      if (!cat) return NextResponse.json({ error: 'CATEGORY_NOT_FOUND' }, { status: 400 })
    }
    if (locationId) {
      const loc = await db.query.locations.findFirst({ where: eq(locations.id, locationId) })
      if (!loc) return NextResponse.json({ error: 'LOCATION_NOT_FOUND' }, { status: 400 })
    }

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

    const authHeader = req.headers.get('authorization')
    if (authHeader) {
      void fetch(`${req.nextUrl.origin}/api/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          eventType: 'tool_listed',
          targetId: tool.id,
          targetTitle: tool.title,
          targetUrl: `/tools/${tool.id}`,
        }),
      }).catch(() => undefined)
    }

    return NextResponse.json({ data: tool }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/tools]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
