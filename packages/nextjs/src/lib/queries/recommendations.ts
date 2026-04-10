import { db } from '@/db'
import { skills, profiles, categories, locations } from '@/db/schema'
import { and, desc, eq, isNull, ne } from 'drizzle-orm'

export type RecommendedSkillRow = {
  id: string
  title: string
  categoryLabel: string | null
  locationNeighborhood: string | null
  locationCity: string | null
  ownerName: string | null
  reason: string
}

type CandidateRow = {
  id: string
  title: string
  categoryId: string | null
  categoryLabel: string | null
  locationId: string | null
  locationNeighborhood: string | null
  locationCity: string | null
  ownerName: string | null
  createdAt: Date
}

function daysSince(date: Date) {
  return Math.max(0, (Date.now() - date.getTime()) / 86_400_000)
}

export async function queryRecommendedSkills(userId: string, limit = 6): Promise<RecommendedSkillRow[]> {
  const [profileRows, ownedSkillRows] = await Promise.all([
    db
      .select({
        locationId: profiles.locationId,
        locationNeighborhood: locations.neighborhood,
        locationCity: locations.city,
      })
      .from(profiles)
      .leftJoin(locations, eq(locations.id, profiles.locationId))
      .where(eq(profiles.userId, userId))
      .limit(1),
    db
      .select({ categoryId: skills.categoryId })
      .from(skills)
      .where(and(eq(skills.ownerId, userId), isNull(skills.deletedAt))),
  ])

  const profile = profileRows[0] ?? null
  const ownedCategoryIds = new Set(
    ownedSkillRows
      .map((row) => row.categoryId)
      .filter((categoryId): categoryId is string => categoryId !== null)
  )

  const candidateRows = await db
    .select({
      id: skills.id,
      title: skills.title,
      categoryId: skills.categoryId,
      categoryLabel: categories.label,
      locationId: skills.locationId,
      locationNeighborhood: locations.neighborhood,
      locationCity: locations.city,
      ownerName: profiles.name,
      createdAt: skills.createdAt,
    })
    .from(skills)
    .leftJoin(categories, eq(categories.id, skills.categoryId))
    .leftJoin(locations, eq(locations.id, skills.locationId))
    .leftJoin(profiles, eq(profiles.userId, skills.ownerId))
    .where(and(isNull(skills.deletedAt), eq(skills.status, 'available'), ne(skills.ownerId, userId)))
    .orderBy(desc(skills.createdAt))
    .limit(40)

  const scored = candidateRows.map((candidate: CandidateRow) => {
    let score = 0
    const reasons: string[] = []

    if (profile?.locationId && candidate.locationId && candidate.locationId === profile.locationId) {
      score += 50
      reasons.push('in your neighborhood')
    } else if (profile?.locationCity && candidate.locationCity === profile.locationCity) {
      score += 25
      reasons.push('in your city')
    }

    if (candidate.categoryId && ownedCategoryIds.has(candidate.categoryId)) {
      score += 20
      reasons.push('matches skills you offer')
    }

    const ageDays = daysSince(new Date(candidate.createdAt))
    score += Math.max(0, 12 - Math.min(12, ageDays))

    if (candidate.ownerName) {
      score += 1
    }

    return {
      ...candidate,
      reason: reasons[0] ?? 'Recently added and available',
      score,
    }
  })

  return scored
    .sort((left, right) => right.score - left.score || new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, limit)
    .map((skill) => ({
      id: skill.id,
      title: skill.title,
      categoryLabel: skill.categoryLabel,
      locationNeighborhood: skill.locationNeighborhood,
      locationCity: skill.locationCity,
      ownerName: skill.ownerName,
      reason: skill.reason,
    }))
}