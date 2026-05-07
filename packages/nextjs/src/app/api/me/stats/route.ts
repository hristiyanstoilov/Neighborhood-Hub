import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { userStats, users } from '@/db/schema'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { requireAuthWithRateLimit } from '@/lib/middleware'

export const GET = requireAuthWithRateLimit(async (_req: NextRequest, { user }) => {
  try {
    const [statsRow, rankRow, countRow] = await Promise.all([
      db
        .select({ totalPoints: userStats.totalPoints, level: userStats.level })
        .from(userStats)
        .where(eq(userStats.userId, user.sub))
        .limit(1),
      db
        .select({ rank: sql<number>`(count(*) + 1)::int` })
        .from(userStats)
        .innerJoin(users, and(eq(users.id, userStats.userId), isNull(users.deletedAt)))
        .where(
          sql`${userStats.totalPoints} > (
            SELECT total_points FROM user_stats WHERE user_id = ${user.sub}::uuid
          )`
        ),
      db
        .select({ total: sql<number>`count(*)::int` })
        .from(userStats)
        .innerJoin(users, and(eq(users.id, userStats.userId), isNull(users.deletedAt))),
    ])

    const stats = statsRow[0]
    const totalUsers = countRow[0]?.total ?? 0

    if (!stats) {
      return NextResponse.json({ data: { totalPoints: 0, level: 1, rank: null, totalUsers } })
    }

    return NextResponse.json({
      data: {
        totalPoints: stats.totalPoints,
        level: stats.level,
        rank: rankRow[0]?.rank ?? null,
        totalUsers,
      },
    })
  } catch (err) {
    console.error('[GET /api/me/stats]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
