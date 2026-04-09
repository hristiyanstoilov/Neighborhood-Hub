import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, profiles, locations, skills, categories } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { uuidSchema } from '@/lib/schemas/skill'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const [profileRow] = await db
      .select({
        userId: users.id,
        name: profiles.name,
        bio: profiles.bio,
        avatarUrl: profiles.avatarUrl,
        isPublic: profiles.isPublic,
        createdAt: users.createdAt,
        locationNeighborhood: locations.neighborhood,
        locationCity: locations.city,
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .leftJoin(locations, eq(locations.id, profiles.locationId))
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1)

    if (!profileRow) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    if (!profileRow.isPublic) {
      return NextResponse.json({ error: 'PROFILE_PRIVATE' }, { status: 403 })
    }

    const skillRows = await db
      .select({
        id: skills.id,
        title: skills.title,
        status: skills.status,
        imageUrl: skills.imageUrl,
        categoryLabel: categories.label,
      })
      .from(skills)
      .leftJoin(categories, eq(categories.id, skills.categoryId))
      .where(and(
        eq(skills.ownerId, id),
        isNull(skills.deletedAt),
        eq(skills.status, 'available'),
      ))
      .limit(20)

    return NextResponse.json({
      data: {
        id: profileRow.userId,
        name: profileRow.name,
        bio: profileRow.bio,
        avatarUrl: profileRow.avatarUrl,
        memberSince: profileRow.createdAt,
        location: profileRow.locationNeighborhood
          ? `${profileRow.locationNeighborhood}, ${profileRow.locationCity ?? ''}`
          : null,
        skills: skillRows,
      },
    })
  } catch (err) {
    console.error('[GET /api/users/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}