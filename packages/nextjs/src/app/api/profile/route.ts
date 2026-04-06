import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { profiles, locations } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireAuth } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'

const updateProfileSchema = z.object({
  name:       z.string().min(1).max(100).optional(),
  bio:        z.string().max(500).optional(),
  avatarUrl:  z.string().url().max(2048).optional().or(z.literal('')),
  locationId: z.string().uuid().optional().or(z.literal('')),
  isPublic:   z.boolean().optional(),
})

// ─── PUT /api/profile — upsert the current user's profile ────────────────────

export const PUT = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { name, bio, avatarUrl, locationId, isPublic } = parsed.data

    // Validate locationId FK if provided and non-empty
    if (locationId) {
      const loc = await db.query.locations.findFirst({ where: eq(locations.id, locationId) })
      if (!loc) return NextResponse.json({ error: 'LOCATION_NOT_FOUND' }, { status: 400 })
    }

    const values = {
      userId:     user.sub,
      name:       name ?? null,
      bio:        bio ?? null,
      avatarUrl:  avatarUrl || null,
      locationId: locationId || null,
      isPublic:   isPublic ?? true,
      updatedAt:  new Date(),
    }

    const [profile] = await db
      .insert(profiles)
      .values({ ...values, createdAt: new Date() })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: {
          name:       values.name,
          bio:        values.bio,
          avatarUrl:  values.avatarUrl,
          locationId: values.locationId,
          isPublic:   values.isPublic,
          updatedAt:  values.updatedAt,
        },
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
