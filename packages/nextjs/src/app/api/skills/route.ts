import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { skills, profiles, categories, locations, users } from '@/db/schema'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireAuth } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { listSkillsSchema, createSkillSchema } from '@/lib/schemas/skill'

// ─── GET /api/skills — public listing ───────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const { success: rateLimitOk } = await apiRatelimit.limit(ip)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const { searchParams } = new URL(req.url)
    const parsed = listSkillsSchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { categoryId, locationId, status, page, limit } = parsed.data

    const conditions = [isNull(skills.deletedAt)]
    if (categoryId) conditions.push(eq(skills.categoryId, categoryId))
    if (locationId) conditions.push(eq(skills.locationId, locationId))
    if (status) conditions.push(eq(skills.status, status))

    const rows = await db
      .select({
        id: skills.id,
        title: skills.title,
        description: skills.description,
        status: skills.status,
        availableHours: skills.availableHours,
        imageUrl: skills.imageUrl,
        createdAt: skills.createdAt,
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
      .where(and(...conditions))
      .limit(limit)
      .offset((page - 1) * limit)
      .orderBy(desc(skills.createdAt))

    return NextResponse.json({ data: rows, page, limit })
  } catch (err) {
    console.error('[GET /api/skills]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// ─── POST /api/skills — create (auth required, email must be verified) ────────

export const POST = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    // Email must be verified to create a skill listing
    const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.sub) })
    if (!dbUser?.emailVerifiedAt) {
      return NextResponse.json({ error: 'UNVERIFIED_EMAIL' }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    const parsed = createSkillSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { title, description, categoryId, availableHours, imageUrl, locationId } = parsed.data

    // Verify FK references exist if provided
    if (categoryId) {
      const cat = await db.query.categories.findFirst({ where: eq(categories.id, categoryId) })
      if (!cat) return NextResponse.json({ error: 'CATEGORY_NOT_FOUND' }, { status: 400 })
    }
    if (locationId) {
      const loc = await db.query.locations.findFirst({ where: eq(locations.id, locationId) })
      if (!loc) return NextResponse.json({ error: 'LOCATION_NOT_FOUND' }, { status: 400 })
    }

    const [skill] = await db
      .insert(skills)
      .values({
        ownerId: user.sub,
        title,
        description: description ?? null,
        categoryId: categoryId ?? null,
        availableHours,
        imageUrl: imageUrl ?? null,
        locationId: locationId ?? null,
      })
      .returning()

    await writeAuditLog({
      userId: user.sub,
      userEmail: user.email,
      action: 'create',
      entity: 'skills',
      entityId: skill.id,
      ipAddress: ip,
    })

    return NextResponse.json({ data: skill }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/skills]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
