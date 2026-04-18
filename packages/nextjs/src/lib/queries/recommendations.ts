import { db } from '@/db'
import { skills, skillRequests, profiles, categories, locations } from '@/db/schema'
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
  ownerId: string
  ownerName: string | null
  ownerBio: string | null
  ownerAvatar: string | null
  createdAt: Date
}

function daysSince(date: Date) {
  return Math.max(0, (Date.now() - date.getTime()) / 86_400_000)
}

export async function queryRecommendedSkills(userId: string, limit = 6): Promise<RecommendedSkillRow[]> {
  const [profileRows, ownedSkillRows, pastRequestRows] = await Promise.all([
    // User's own profile + location
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

    // Categories the user offers
    db
      .select({ categoryId: skills.categoryId })
      .from(skills)
      .where(and(eq(skills.ownerId, userId), isNull(skills.deletedAt))),

    // Categories + owners the user has previously requested
    db
      .select({ categoryId: skills.categoryId, userToId: skillRequests.userToId })
      .from(skillRequests)
      .innerJoin(skills, eq(skills.id, skillRequests.skillId))
      .where(eq(skillRequests.userFromId, userId))
      .limit(50),
  ])

  const profile = profileRows[0] ?? null

  const ownedCategoryIds = new Set(
    ownedSkillRows
      .map((r) => r.categoryId)
      .filter((id): id is string => id !== null)
  )

  const requestedCategoryIds = new Set(
    pastRequestRows
      .map((r) => r.categoryId)
      .filter((id): id is string => id !== null)
  )

  // Owners the user has already requested from (reduce repetition)
  const alreadyRequestedOwnerIds = new Set(
    pastRequestRows.map((r) => r.userToId)
  )

  const candidateRows = await db
    .select({
      id:                   skills.id,
      title:                skills.title,
      categoryId:           skills.categoryId,
      categoryLabel:        categories.label,
      locationId:           skills.locationId,
      locationNeighborhood: locations.neighborhood,
      locationCity:         locations.city,
      ownerId:              skills.ownerId,
      ownerName:            profiles.name,
      ownerBio:             profiles.bio,
      ownerAvatar:          profiles.avatarUrl,
      createdAt:            skills.createdAt,
    })
    .from(skills)
    .leftJoin(categories, eq(categories.id, skills.categoryId))
    .leftJoin(locations,  eq(locations.id,  skills.locationId))
    .leftJoin(profiles,   eq(profiles.userId, skills.ownerId))
    .where(and(
      isNull(skills.deletedAt),
      eq(skills.status, 'available'),
      ne(skills.ownerId, userId),
    ))
    .orderBy(desc(skills.createdAt))
    .limit(50)

  const scored = candidateRows.map((candidate: CandidateRow) => {
    let score = 0
    const reasons: string[] = []

    // ── Location signals ──────────────────────────────────────────────────────
    if (profile?.locationId && candidate.locationId === profile.locationId) {
      score += 50
      reasons.push(`In ${candidate.locationNeighborhood} — your neighborhood`)
    } else if (profile?.locationCity && candidate.locationCity === profile.locationCity) {
      score += 25
      reasons.push(`In ${candidate.locationCity}`)
    }

    // ── Category: previously requested (strongest intent signal) ─────────────
    if (candidate.categoryId && requestedCategoryIds.has(candidate.categoryId)) {
      score += 30
      reasons.push(`You've looked for ${candidate.categoryLabel} before`)
    }

    // ── Category: matches what the user offers (skill swap) ───────────────────
    if (candidate.categoryId && ownedCategoryIds.has(candidate.categoryId)) {
      score += 20
      reasons.push(`Matches skills you offer`)
    }

    // ── Rich owner profile ────────────────────────────────────────────────────
    if (candidate.ownerBio && candidate.ownerAvatar) {
      score += 10
    } else if (candidate.ownerName) {
      score += 3
    }

    // ── Penalise owners already requested from (avoid repetition) ────────────
    if (alreadyRequestedOwnerIds.has(candidate.ownerId)) {
      score -= 10
    }

    // ── Recency boost (up to 12 pts for skills added within 12 days) ─────────
    const ageDays = daysSince(new Date(candidate.createdAt))
    score += Math.max(0, 12 - Math.min(12, ageDays))

    return {
      ...candidate,
      score,
      reason: reasons[0] ?? 'Recently added and available',
    }
  })

  return scored
    .sort((a, b) => b.score - a.score || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
    .map((s) => ({
      id:                   s.id,
      title:                s.title,
      categoryLabel:        s.categoryLabel,
      locationNeighborhood: s.locationNeighborhood,
      locationCity:         s.locationCity,
      ownerName:            s.ownerName,
      reason:               s.reason,
    }))
}
