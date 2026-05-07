import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { userStats, profiles, users } from '@/db/schema'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { searchPublicRatelimit } from '@/lib/ratelimit'
import { getClientIp } from '@/lib/middleware'

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const { success } = await searchPublicRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const rows = await db
      .select({
        userId:      userStats.userId,
        totalPoints: userStats.totalPoints,
        level:       userStats.level,
        name:        profiles.name,
        avatarUrl:   profiles.avatarUrl,
      })
      .from(userStats)
      .innerJoin(users, and(eq(users.id, userStats.userId), isNull(users.deletedAt)))
      .innerJoin(profiles, and(eq(profiles.userId, userStats.userId), eq(profiles.isPublic, true)))
      .orderBy(desc(userStats.totalPoints))
      .limit(100)

    return NextResponse.json({ data: rows })
  } catch (err) {
    console.error('[GET /api/leaderboard]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
