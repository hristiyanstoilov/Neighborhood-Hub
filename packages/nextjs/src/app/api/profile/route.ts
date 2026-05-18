import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { profiles, locations, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getClientIp, requireAuthWithRateLimit } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'

// ─── GET /api/profile — get current user's profile with location ──────────────

export const GET = requireAuthWithRateLimit(async (_req: NextRequest, { user }) => {
  try {
    const [dbUser, rows] = await Promise.all([
      db.query.users.findFirst({ where: eq(users.id, user.sub) }),
      db
        .select({
          name:              profiles.name,
          bio:               profiles.bio,
          avatarUrl:         profiles.avatarUrl,
          isPublic:          profiles.isPublic,
          locationId:        profiles.locationId,
          defaultLocationId: profiles.defaultLocationId,
          locationCity:      locations.city,
          locationNeighborhood: locations.neighborhood,
        })
        .from(profiles)
        .leftJoin(locations, eq(locations.id, profiles.locationId))
        .where(eq(profiles.userId, user.sub))
        .limit(1),
    ])

    if (!dbUser) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })
    }

    const profile = rows[0] ?? null

    return NextResponse.json({
      data: {
        email:             dbUser.email,
        emailVerifiedAt:   dbUser.emailVerifiedAt,
        name:              profile?.name ?? null,
        bio:               profile?.bio ?? null,
        avatarUrl:         profile?.avatarUrl ?? null,
        isPublic:          profile?.isPublic ?? true,
        locationId:        profile?.locationId ?? null,
        defaultLocationId: profile?.defaultLocationId ?? null,
        locationCity:      profile?.locationCity ?? null,
        locationNeighborhood: profile?.locationNeighborhood ?? null,
      },
    })
  } catch (err) {
    console.error('[GET /api/profile]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

const updateProfileSchema = z.object({
  name:       z.string().min(1).max(100).optional(),
  bio:        z.string().max(500).optional(),
  defaultLocationId: z.string().uuid().optional().nullable(),
  avatarUrl:  z.string().url().max(2048).optional().or(z.literal('')),
  locationId: z.string().uuid().optional().or(z.literal('')),
  isPublic:   z.boolean().optional(),
})

// ─── PUT /api/profile — upsert the current user's profile ────────────────────

export const PUT = requireAuthWithRateLimit(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)

    const body = await req.json().catch(() => null)
    if (body === null) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { name, bio, defaultLocationId, avatarUrl, locationId, isPublic } = parsed.data

    // Validate locationId FK if provided and non-empty
    if (locationId) {
      const loc = await db.query.locations.findFirst({ where: eq(locations.id, locationId) })
      if (!loc) return NextResponse.json({ error: 'LOCATION_NOT_FOUND' }, { status: 400 })
    }

    // Validate defaultLocationId FK if provided and non-empty
    if (defaultLocationId) {
      const rows = await db.select().from(locations).where(eq(locations.id, defaultLocationId)).limit(1)
      if (!rows || rows.length === 0) return NextResponse.json({ error: 'LOCATION_NOT_FOUND' }, { status: 400 })
    }

    const values = {
      userId:     user.sub,
      name:       name ?? null,
      bio:        bio ?? null,
      defaultLocationId: defaultLocationId ?? null,
      avatarUrl:  avatarUrl || null,
      locationId: locationId || null,
      updatedAt:  new Date(),
    }

    const conflictSet: Record<string, unknown> = { ...values }
    // Only update isPublic when the caller explicitly sends it
    if (isPublic !== undefined) conflictSet.isPublic = isPublic
    if (defaultLocationId !== undefined) conflictSet.defaultLocationId = defaultLocationId

    const [profile] = await db
      .insert(profiles)
      .values({ ...values, isPublic: isPublic ?? true, createdAt: new Date() })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: conflictSet,
      })
      .returning()

    await writeAuditLog({
      userId:    user.sub,
      userEmail: user.email,
      action:    'update',
      entity:    'profiles',
      entityId:  profile.id,
      ipAddress: ip,
    })

    return NextResponse.json({ data: profile })
  } catch (err) {
    console.error('[PUT /api/profile]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
