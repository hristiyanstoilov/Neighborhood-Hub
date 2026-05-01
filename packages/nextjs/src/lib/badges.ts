import { and, count, eq, or } from 'drizzle-orm'
import { db } from '@/db'
import { badges, foodShares, ratings, skillRequests, skills, tools, userStats } from '@/db/schema'

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
    database.select({ total: count() }).from(skills).where(eq(skills.ownerId, userId)),
    database.select({ total: count() }).from(tools).where(eq(tools.ownerId, userId)),
    database.select({ total: count() }).from(foodShares).where(eq(foodShares.ownerId, userId)),
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
  if ((completedRequests[0]?.total ?? 0) >= 10) candidates.push({ userId, type: 'community_hero' })

  if (candidates.length === 0) return

  await database.insert(badges).values(candidates).onConflictDoNothing()
}
