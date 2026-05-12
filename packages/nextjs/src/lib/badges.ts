import { and, count, eq, isNull, or, sql } from 'drizzle-orm'
import { db } from '@/db'
import { badges, foodShares, ratings, skillRequests, skills, tools, userStats } from '@/db/schema'

const LEVEL_THRESHOLDS = [0, 10, 30, 60, 100, 200]

export function computeLevel(points: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

export async function awardPoints(userId: string, points: number): Promise<number> {
  if (points <= 0) throw new Error(`awardPoints: points must be positive, got ${points}`)
  const [row] = await db
    .insert(userStats)
    .values({ userId, totalPoints: points, level: computeLevel(points) })
    .onConflictDoUpdate({
      target: userStats.userId,
      set: {
        totalPoints: sql`user_stats.total_points + ${points}`,
        level: sql`GREATEST(1, (
          SELECT CASE
            WHEN user_stats.total_points + ${points} >= 200 THEN 6
            WHEN user_stats.total_points + ${points} >= 100 THEN 5
            WHEN user_stats.total_points + ${points} >= 60  THEN 4
            WHEN user_stats.total_points + ${points} >= 30  THEN 3
            WHEN user_stats.total_points + ${points} >= 10  THEN 2
            ELSE 1
          END
        ))`,
        updatedAt: sql`now()`,
      },
    })
    .returning({ totalPoints: userStats.totalPoints })
  return row?.totalPoints ?? 0
}

export const BADGE_TYPES = [
  'first_skill',
  'first_tool',
  'first_food',
  'ten_points',
  'fifty_points',
  'five_star_giver',
  'community_hero',
] as const

export type BadgeType = (typeof BADGE_TYPES)[number]

type BadgeCandidate = {
  userId: string
  type: BadgeType
}

export async function checkAndAwardBadges(userId: string, database = db): Promise<void> {
  const [skillCount, toolCount, foodCount, pointsRow, completedRequests, fiveStarRatings] = await Promise.all([
    database.select({ total: count() }).from(skills).where(and(eq(skills.ownerId, userId), isNull(skills.deletedAt))),
    database.select({ total: count() }).from(tools).where(and(eq(tools.ownerId, userId), isNull(tools.deletedAt))),
    database.select({ total: count() }).from(foodShares).where(and(eq(foodShares.ownerId, userId), isNull(foodShares.deletedAt))),
    database.select({ totalPoints: userStats.totalPoints }).from(userStats).where(eq(userStats.userId, userId)).limit(1),
    database
      .select({ total: count() })
      .from(skillRequests)
      .where(
        and(
          or(eq(skillRequests.userFromId, userId), eq(skillRequests.userToId, userId)),
          eq(skillRequests.status, 'completed')
        )
      ),
    database.select({ total: count() }).from(ratings).where(and(eq(ratings.raterId, userId), eq(ratings.score, 5))),
  ])

  const totalPoints = pointsRow[0]?.totalPoints ?? 0
  const candidates: BadgeCandidate[] = []

  if ((skillCount[0]?.total ?? 0) > 0) candidates.push({ userId, type: 'first_skill' })
  if ((toolCount[0]?.total ?? 0) > 0) candidates.push({ userId, type: 'first_tool' })
  if ((foodCount[0]?.total ?? 0) > 0) candidates.push({ userId, type: 'first_food' })
  if (totalPoints >= 10) candidates.push({ userId, type: 'ten_points' })
  if (totalPoints >= 50) candidates.push({ userId, type: 'fifty_points' })
  if ((fiveStarRatings[0]?.total ?? 0) > 0) candidates.push({ userId, type: 'five_star_giver' })
  if ((completedRequests[0]?.total ?? 0) >= 3) candidates.push({ userId, type: 'community_hero' })

  if (candidates.length === 0) return

  await database.insert(badges).values(candidates).onConflictDoNothing()
}
