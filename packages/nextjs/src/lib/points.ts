import { db } from '@/db'
import { pointEvents, userStats } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { randomUUID } from 'crypto'

export type PointEventType =
  | 'skill_shared'
  | 'tool_lent'
  | 'food_donated'
  | 'drive_pledged'
  | 'rating_given'
  | 'five_star_received'

const POINT_VALUES: Record<PointEventType, number> = {
  skill_shared:       20,
  tool_lent:          15,
  food_donated:       10,
  drive_pledged:      10,
  rating_given:        5,
  five_star_received: 25,
}

const LEVEL_THRESHOLDS = [0, 50, 150, 350, 700] // level 1..5

export function computeLevel(totalPoints: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

export async function awardPoints(
  userId: string,
  type: PointEventType,
  entityId?: string,
): Promise<void> {
  const points = POINT_VALUES[type]

  await db.insert(pointEvents).values({
    id: randomUUID(),
    userId,
    type,
    points,
    entityId: entityId ?? null,
  })

  const existing = await db
    .select({ id: userStats.id, totalPoints: userStats.totalPoints })
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1)

  if (existing.length === 0) {
    const newTotal = points
    await db.insert(userStats).values({
      id: randomUUID(),
      userId,
      totalPoints: newTotal,
      level: computeLevel(newTotal),
    })
  } else {
    const newTotal = Math.max(0, existing[0].totalPoints + points)
    await db
      .update(userStats)
      .set({ totalPoints: newTotal, level: computeLevel(newTotal), updatedAt: new Date() })
      .where(eq(userStats.userId, userId))
  }
}
