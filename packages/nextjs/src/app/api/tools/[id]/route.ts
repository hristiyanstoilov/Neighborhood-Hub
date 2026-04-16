import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { tools, categories, locations } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireAuth } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { updateToolSchema } from '@/lib/schemas/tool'
import { uuidSchema } from '@/lib/schemas/skill'
import { queryToolById } from '@/lib/queries/tools'

// ─── GET /api/tools/[id] — public detail ────────────────────────────────────

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const tool = await queryToolById(id)
    if (!tool) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    return NextResponse.json({ data: tool })
  } catch (err) {
    console.error('[GET /api/tools/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// ─── PUT /api/tools/[id] — update (owner only) ──────────────────────────────

export const PUT = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').at(-1)!
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const existing = await db.query.tools.findFirst({
      where: and(eq(tools.id, id), isNull(tools.deletedAt)),
    })
    if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (existing.ownerId !== user.sub) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

    const body = await req.json().catch(() => null)
    const parsed = updateToolSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { categoryId, locationId, ...rest } = parsed.data

    if (categoryId) {
      const cat = await db.query.categories.findFirst({ where: eq(categories.id, categoryId) })
      if (!cat) return NextResponse.json({ error: 'CATEGORY_NOT_FOUND' }, { status: 400 })
    }
    if (locationId) {
      const loc = await db.query.locations.findFirst({ where: eq(locations.id, locationId) })
      if (!loc) return NextResponse.json({ error: 'LOCATION_NOT_FOUND' }, { status: 400 })
    }

    const [updated] = await db
      .update(tools)
      .set({ ...rest, categoryId: categoryId ?? existing.categoryId, locationId: locationId ?? existing.locationId, updatedAt: new Date() })
      .where(eq(tools.id, id))
      .returning()

    await writeAuditLog({
      userId:    user.sub,
      userEmail: user.email,
      action:    'update',
      entity:    'tools',
      entityId:  id,
      ipAddress: ip,
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PUT /api/tools/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

// ─── DELETE /api/tools/[id] — soft delete (owner only) ──────────────────────

export const DELETE = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').at(-1)!
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const existing = await db.query.tools.findFirst({
      where: and(eq(tools.id, id), isNull(tools.deletedAt)),
    })
    if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (existing.ownerId !== user.sub) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

    await db.update(tools).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(tools.id, id))

    await writeAuditLog({
      userId:    user.sub,
      userEmail: user.email,
      action:    'delete',
      entity:    'tools',
      entityId:  id,
      ipAddress: ip,
    })

    return NextResponse.json({ data: { id } })
  } catch (err) {
    console.error('[DELETE /api/tools/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
