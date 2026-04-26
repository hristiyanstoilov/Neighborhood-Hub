import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { profiles, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/middleware'
import { apiRatelimit } from '@/lib/ratelimit'

export const GET = requireAuth(async (_req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const [dbUser, profile] = await Promise.all([
      db.query.users.findFirst({ where: eq(users.id, user.sub) }),
      db.query.profiles.findFirst({ where: eq(profiles.userId, user.sub) }),
    ])

    if (!dbUser || dbUser.deletedAt) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 401 })
    }

    return NextResponse.json({
      data: {
        id: user.sub,
        email: user.email,
        role: user.role,
        emailVerifiedAt: dbUser.emailVerifiedAt,
        notificationsEnabled: dbUser.notificationsEnabled,
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
