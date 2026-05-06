import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { and, count, eq, isNull } from 'drizzle-orm'
import { getTranslations } from 'next-intl/server'
import { db } from '@/db'
import { badges, profiles, skillRequests, users } from '@/db/schema'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { ProfilePageHeader } from './_components/profile-page-header'
import { ProfileSummaryCard } from './_components/profile-summary-card'
import { ProfileEmailWarning } from './_components/profile-email-warning'
import { DangerZone } from './_components/danger-zone'
import { PointsBadge } from './_components/points-badge'
import { TimeCreditCard } from './_components/time-credit-card'
import { AchievementBadges } from '@/components/achievement-badges'
import type { Achievement } from '@/components/achievement-badges'
import type { BadgeType } from '@/lib/badges'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const t = await getTranslations('profile')
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  const authedUser = refreshToken ? await queryUserByRefreshToken(refreshToken) : null

  if (!authedUser) {
    redirect('/login')
  }

  const [profileRow, badgeRows, taughtRows, receivedRows] = await Promise.all([
    db
      .select({
        email: users.email,
        role: users.role,
        emailVerifiedAt: users.emailVerifiedAt,
        avatarUrl: profiles.avatarUrl,
        name: profiles.name,
        bio: profiles.bio,
        isPublic: profiles.isPublic,
        avgRating: profiles.avgRating,
        ratingCount: profiles.ratingCount,
      })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(and(eq(users.id, authedUser.id), isNull(users.deletedAt)))
      .limit(1),
    db
      .select({
        type: badges.type,
        awardedAt: badges.awardedAt,
      })
      .from(badges)
      .where(eq(badges.userId, authedUser.id))
      .orderBy(badges.awardedAt),
    db.select({ total: count() }).from(skillRequests)
      .where(and(eq(skillRequests.userToId, authedUser.id), eq(skillRequests.status, 'completed'))),
    db.select({ total: count() }).from(skillRequests)
      .where(and(eq(skillRequests.userFromId, authedUser.id), eq(skillRequests.status, 'completed'))),
  ])

  const profile = profileRow[0]
  if (!profile) {
    redirect('/login')
  }

  const taught   = taughtRows[0]?.total ?? 0
  const received = receivedRows[0]?.total ?? 0

  const user = {
    email: profile.email,
    role: profile.role,
    emailVerifiedAt: profile.emailVerifiedAt?.toISOString() ?? null,
    profile: {
      avatarUrl: profile.avatarUrl,
      name: profile.name,
      bio: profile.bio,
      isPublic: profile.isPublic,
      avgRating: profile.avgRating,
      ratingCount: profile.ratingCount,
    },
  }

  const badgeLabels: Record<BadgeType, string> = {
    first_skill: t('achievement_first_skill'),
    first_tool: t('achievement_first_tool'),
    first_food: t('achievement_first_food'),
    ten_points: t('achievement_ten_points'),
    fifty_points: t('achievement_fifty_points'),
    five_star_giver: t('achievement_five_star_giver'),
    community_hero: t('achievement_community_hero'),
  }

  const badgeCriteria: Record<BadgeType, string> = {
    first_skill: t('criteria_first_skill'),
    first_tool: t('criteria_first_tool'),
    first_food: t('criteria_first_food'),
    ten_points: t('criteria_ten_points'),
    fifty_points: t('criteria_fifty_points'),
    five_star_giver: t('criteria_five_star_giver'),
    community_hero: t('criteria_community_hero'),
  }

  return (
    <div className="max-w-lg space-y-4">
      <ProfilePageHeader />
      <ProfileSummaryCard user={user} />
      <AchievementBadges
        badges={badgeRows as Achievement[]}
        labels={badgeLabels}
        criteria={badgeCriteria}
        title={t('achievements_title')}
        emptyLabel={t('achievements_empty')}
        caption={t('achievements_caption')}
      />
      <TimeCreditCard taught={taught} received={received} />
      <PointsBadge />
      {!profile.emailVerifiedAt && <ProfileEmailWarning />}
      <DangerZone />
    </div>
  )
}
