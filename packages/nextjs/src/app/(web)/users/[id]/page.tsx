import { notFound } from 'next/navigation'
import { db } from '@/db'
import { badges, categories, foodShares, locations, profiles, skillRequests, skills, users } from '@/db/schema'
import { count, eq, and, isNull, or } from 'drizzle-orm'
import { getTranslations } from 'next-intl/server'
import { uuidSchema } from '@/lib/schemas/skill'
import { DEFAULT_PROFILE_NAME } from '@/lib/constants'
import { ErrorState } from '@/components/ui/async-states'
import { AchievementBadges } from '@/components/achievement-badges'
import type { Achievement } from '@/components/achievement-badges'
import { PublicProfileBackLink } from './_components/public-profile-back-link'
import { PublicProfileHeader } from './_components/public-profile-header'
import { PublicProfileSkills } from './_components/public-profile-skills'
import { PublicProfileRatings } from './_components/public-profile-ratings'
import { PrivateProfileState } from './_components/private-profile-state'
import type { BadgeType } from '@/lib/badges'
import { BlockButton } from '@/components/ui/block-button'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!uuidSchema.safeParse(id).success) return {}
  try {
    const [r] = await db
      .select({ name: profiles.name, bio: profiles.bio })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1)
    if (!r) return {}
    const name = r.name ?? DEFAULT_PROFILE_NAME
    const description = r.bio ?? `View ${name}'s skills and profile on Neighborhood Hub.`
    return {
      title: `${name}'s Profile`,
      description,
      openGraph: {
        title: `${name}'s Profile`,
        description,
        type: 'profile',
      },
    }
  } catch { return {} }
}

type Props = { params: Promise<{ id: string }> }

export default async function PublicProfilePage({ params }: Props) {
  const t = await getTranslations('profile')
  const { id } = await params

  if (!uuidSchema.safeParse(id).success) notFound()

  let row: {
    userId: string; name: string | null; bio: string | null
    avatarUrl: string | null; isPublic: boolean
    avgRating: string | null; ratingCount: number
    city: string | null; neighborhood: string | null
  } | null = null
  let fetchError = false

  try {
    const [r] = await db
      .select({
        userId: users.id,
        name: profiles.name,
        bio: profiles.bio,
        avatarUrl: profiles.avatarUrl,
        isPublic: profiles.isPublic,
        avgRating: profiles.avgRating,
        ratingCount: profiles.ratingCount,
        city: locations.city,
        neighborhood: locations.neighborhood,
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .leftJoin(locations, eq(locations.id, profiles.locationId))
      .where(and(eq(users.id, id), isNull(users.deletedAt)))
      .limit(1)
    row = r ?? null
  } catch {
    fetchError = true
  }

  if (fetchError) {
    return (
      <div className="max-w-2xl">
        <PublicProfileBackLink />
        <ErrorState title="Could not load this profile." message="Please try refreshing the page." />
      </div>
    )
  }

  if (!row) notFound()

  if (!row.isPublic) {
    return (
      <div className="max-w-2xl">
        <PublicProfileBackLink />
        <PrivateProfileState />
      </div>
    )
  }

  const [userSkills, badgeRows, completedExchangeRows, foodShareRows] = await Promise.all([
    db
      .select({
        id: skills.id,
        title: skills.title,
        imageUrl: skills.imageUrl,
        categoryLabel: categories.label,
      })
      .from(skills)
      .leftJoin(categories, eq(categories.id, skills.categoryId))
      .where(and(eq(skills.ownerId, id), isNull(skills.deletedAt), eq(skills.status, 'available')))
      .limit(20),
    db
      .select({
        type: badges.type,
        awardedAt: badges.awardedAt,
      })
      .from(badges)
      .where(eq(badges.userId, id))
      .orderBy(badges.awardedAt),
    db
      .select({ total: count() })
      .from(skillRequests)
      .where(
        and(
          or(eq(skillRequests.userFromId, id), eq(skillRequests.userToId, id)),
          eq(skillRequests.status, 'completed')
        )
      ),
    db
      .select({ total: count() })
      .from(foodShares)
      .where(and(eq(foodShares.ownerId, id), isNull(foodShares.deletedAt))),
  ])

  const completedExchanges = completedExchangeRows[0]?.total ?? 0
  const foodShareCount = foodShareRows[0]?.total ?? 0

  const location = row.neighborhood
    ? row.city ? `${row.neighborhood}, ${row.city}` : row.neighborhood
    : row.city ?? null

  const badgeLabels: Record<BadgeType, string> = {
    first_skill:    t('achievement_first_skill'),
    first_tool:     t('achievement_first_tool'),
    first_food:     t('achievement_first_food'),
    ten_points:     t('achievement_ten_points'),
    fifty_points:   t('achievement_fifty_points'),
    five_star_giver:t('achievement_five_star_giver'),
    community_hero: t('achievement_community_hero'),
    first_event:    t('achievement_first_event'),
    first_drive:    t('achievement_first_drive'),
    good_neighbor:  t('achievement_good_neighbor'),
    tool_master:    t('achievement_tool_master'),
  }

  const badgeCriteria: Record<BadgeType, string> = {
    first_skill:    t('criteria_first_skill'),
    first_tool:     t('criteria_first_tool'),
    first_food:     t('criteria_first_food'),
    ten_points:     t('criteria_ten_points'),
    fifty_points:   t('criteria_fifty_points'),
    five_star_giver:t('criteria_five_star_giver'),
    community_hero: t('criteria_community_hero'),
    first_event:    t('criteria_first_event'),
    first_drive:    t('criteria_first_drive'),
    good_neighbor:  t('criteria_good_neighbor'),
    tool_master:    t('criteria_tool_master'),
  }

  return (
    <div className="max-w-2xl space-y-4">
      <PublicProfileBackLink />
      <PublicProfileHeader
        name={row.name}
        avatarUrl={row.avatarUrl}
        location={location}
        bio={row.bio}
        avgRating={row.avgRating}
        ratingCount={row.ratingCount}
      />
      {(completedExchanges > 0 || foodShareCount > 0) && (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-4 flex gap-6 text-sm text-gray-600">
          {completedExchanges > 0 && (
            <span>
              <strong className="text-gray-900">{completedExchanges}</strong> completed exchange{completedExchanges !== 1 ? 's' : ''}
            </span>
          )}
          {foodShareCount > 0 && (
            <span>
              <strong className="text-gray-900">{foodShareCount}</strong> food share{foodShareCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}
      <AchievementBadges
        badges={badgeRows as Achievement[]}
        labels={badgeLabels}
        criteria={badgeCriteria}
        title={t('achievements_title')}
        emptyLabel={t('achievements_empty')}
        caption={t('achievements_caption')}
      />
      <PublicProfileSkills skills={userSkills} />
      <div className="mt-6">
        <PublicProfileRatings userId={id} />
      </div>
      <div className="flex gap-4 pt-2">
        <BlockButton userId={id} />
      </div>
    </div>
  )
}