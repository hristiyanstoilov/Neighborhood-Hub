import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/middleware'

export const GET = requireAuth(async (_req: NextRequest, { user }) => {
  try {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, user.sub),
    })

    return NextResponse.json({
      data: {
        id: user.sub,
        email: user.email,
        role: user.role,
        profile: profile
          ? {
              name: profile.name,
              bio: profile.bio,
              avatarUrl: profile.avatarUrl,
              isPublic: profile.isPublic,
              locationId: profile.locationId,
            }
          : null,
      },
    })
  } catch (err) {
    console.error('[me]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
