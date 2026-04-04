import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { skills, profiles, categories, locations } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireAuth } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { updateSkillSchema, uuidSchema } from '@/lib/schemas/skill'

type Params = { params: Promise<{ id: string }> }

// ─── GET /api/skills/[id] — public detail ────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const [row] = await db
      .select({
        id: skills.id,
        title: skills.title,
        description: skills.description,
        status: skills.status,
        availableHours: skills.availableHours,
        imageUrl: skills.imageUrl,
        createdAt: skills.createdAt,
        updatedAt: skills.updatedAt,
        ownerId: skills.ownerId,
        ownerName: profiles.name,
        ownerAvatar: profiles.avatarUrl,
        categoryId: skills.categoryId,
        categorySlug: categories.slug,
        categoryLabel: categories.label,
        locationId: skills.locationId,
        locationCity: locations.city,
        locationNeighborhood: locations.neighborhood,
      })
      .from(skills)
      .leftJoin(profiles, eq(profiles.userId, skills.ownerId))
      .leftJoin(categories, eq(categories.id, skills.categoryId))
      .leftJoin(locations, eq(locations.id, skills.locationId))
      .where(and(eq(skills.id, id), isNull(skills.deletedAt)))
      .limit(1)

    if (!row) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json({ data: row })
  } catch (err) {
    console.error('[GET /api/skills/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// ─── PUT /api/skills/[id] — update (owner only) ───────────────────────────────

export const PUT = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').at(-1)!
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const parsed = updateSkillSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const existing = await db.query.skills.findFirst({
      where: and(eq(skills.id, id), eq(skills.ownerId, user.sub), isNull(skills.deletedAt)),
    })
    if (!existing) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const { categoryId, locationId } = parsed.data

    if (categoryId) {
      const cat = await db.query.categories.findFirst({ where: eq(categories.id, categoryId) })
      if (!cat) return NextResponse.json({ error: 'CATEGORY_NOT_FOUND' }, { status: 400 })
    }
    if (locationId) {
      const loc = await db.query.locations.findFirst({ where: eq(locations.id, locationId) })
      if (!loc) return NextResponse.json({ error: 'LOCATION_NOT_FOUND' }, { status: 400 })
    }

    const [updated] = await db
      .update(skills)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(skills.id, id), eq(skills.ownerId, user.sub)))
      .returning()

    await writeAuditLog({
      userId: user.sub,
      userEmail: user.email,
      action: 'update',
      entity: 'skills',
      entityId: id,
      ipAddress: ip,
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PUT /api/skills/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

// ─── DELETE /api/skills/[id] — soft delete (owner only) ──────────────────────

export const DELETE = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').at(-1)!
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const existing = await db.query.skills.findFirst({
      where: and(eq(skills.id, id), eq(skills.ownerId, user.sub), isNull(skills.deletedAt)),
    })
    if (!existing) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    await db
      .update(skills)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(skills.id, id), eq(skills.ownerId, user.sub)))

    await writeAuditLog({
      userId: user.sub,
      userEmail: user.email,
      action: 'delete',
      entity: 'skills',
      entityId: id,
      ipAddress: ip,
    })

    return NextResponse.json({ data: { message: 'Skill deleted.' } })
  } catch (err) {
    console.error('[DELETE /api/skills/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
