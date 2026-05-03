import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { userStats, profiles } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
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
        totalPoints: userStats.totalPoints,
        level:       userStats.level,
        name:        profiles.name,
        avatarUrl:   profiles.avatarUrl,
      })
      .from(userStats)
      .leftJoin(profiles, eq(profiles.userId, userStats.userId))
      .orderBy(desc(userStats.totalPoints))
      .limit(100)

    return NextResponse.json({ data: rows })
  } catch (err) {
    console.error('[GET /api/leaderboard]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
