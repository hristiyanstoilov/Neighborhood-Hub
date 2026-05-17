import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { ratings, profiles } from '@/db/schema'
import { eq, avg, count, notInArray } from 'drizzle-orm'
import { requireAdmin } from '@/lib/middleware'
import { apiRatelimit } from '@/lib/ratelimit'

// ─── POST /api/admin/recalc-ratings — recalculate rating stats ────────────────

export const POST = requireAdmin(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    // 1. Fetch recalculated stats grouped by ratedUserId
    const stats = await db
      .select({
        userId: ratings.ratedUserId,
        newAvg: avg(ratings.score),
        newCount: count(),
      })
      .from(ratings)
      .groupBy(ratings.ratedUserId)

    // 2. Update each profile in a loop (drizzle-orm/neon-http does NOT support transactions)
    let updated = 0
    for (const stat of stats) {
      await db
        .update(profiles)
        .set({
          avgRating: stat.newAvg,
          ratingCount: Number(stat.newCount),
        })
        .where(eq(profiles.userId, stat.userId))
      updated++
    }

    // 3. Zero out profiles with no ratings
    if (stats.length > 0) {
      const ratedUserIds = stats.map((s) => s.userId)
      await db
        .update(profiles)
        .set({ avgRating: null, ratingCount: 0 })
        .where(notInArray(profiles.userId, ratedUserIds))
    }

    console.info(`[admin/recalc-ratings] user=${user.sub} recalculated ${updated} profile(s)`)

    return NextResponse.json({ data: { updated } })
  } catch (err) {
    console.error('[POST /api/admin/recalc-ratings]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
