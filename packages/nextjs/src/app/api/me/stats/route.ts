import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { userStats } from '@/db/schema'
import { eq, gt, sql } from 'drizzle-orm'
import { requireAuth } from '@/lib/middleware'

export const GET = requireAuth(async (_req: NextRequest, { user }) => {
  try {
    const [stats] = await db
      .select({ totalPoints: userStats.totalPoints, level: userStats.level })
      .from(userStats)
      .where(eq(userStats.userId, user.sub))
      .limit(1)

    if (!stats) {
      return NextResponse.json({ data: { totalPoints: 0, level: 1, rank: null } })
    }

    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(userStats)
      .where(gt(userStats.totalPoints, stats.totalPoints))

    return NextResponse.json({ data: { totalPoints: stats.totalPoints, level: stats.level, rank: count + 1 } })
  } catch (err) {
    console.error('[GET /api/me/stats]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
