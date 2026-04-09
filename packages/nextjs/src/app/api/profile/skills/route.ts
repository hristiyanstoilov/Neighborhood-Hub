import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { skills, profiles, categories, locations } from '@/db/schema'
import { eq, and, isNull, desc, count } from 'drizzle-orm'
import { requireAuth } from '@/lib/middleware'
import { apiRatelimit } from '@/lib/ratelimit'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export const GET = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const { searchParams } = new URL(req.url)
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const { page, limit } = parsed.data
    const condition = and(eq(skills.ownerId, user.sub), isNull(skills.deletedAt))

    const [rows, [{ total }]] = await Promise.all([
      db
        .select({
          id: skills.id,
          title: skills.title,
          description: skills.description,
          status: skills.status,
          availableHours: skills.availableHours,
          imageUrl: skills.imageUrl,
          createdAt: skills.createdAt,
          categoryLabel: categories.label,
          locationNeighborhood: locations.neighborhood,
          locationCity: locations.city,
        })
        .from(skills)
        .leftJoin(categories, eq(categories.id, skills.categoryId))
        .leftJoin(locations, eq(locations.id, skills.locationId))
        .where(condition)
        .orderBy(desc(skills.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      db.select({ total: count() }).from(skills).where(condition),
    ])

    return NextResponse.json({ data: rows, total: total })
  } catch (err) {
    console.error('[GET /api/profile/skills]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})