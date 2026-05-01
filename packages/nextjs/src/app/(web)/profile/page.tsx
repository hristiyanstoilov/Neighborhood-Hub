import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { and, eq, isNull } from 'drizzle-orm'
import { getTranslations } from 'next-intl/server'
import { db } from '@/db'
import { badges, profiles, users } from '@/db/schema'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { ProfilePageHeader } from './_components/profile-page-header'
import { ProfileSummaryCard } from './_components/profile-summary-card'
import { ProfileEmailWarning } from './_components/profile-email-warning'
import { DangerZone } from './_components/danger-zone'
import { PointsBadge } from './_components/points-badge'
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

  const [profileRow, badgeRows] = await Promise.all([
    db
      .select({
        email: users.email,
        role: users.role,
        emailVerifiedAt: users.emailVerifiedAt,
        avatarUrl: profiles.avatarUrl,
        name: profiles.name,
        bio: profiles.bio,
        isPublic: profiles.isPublic,
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
  ])

  const profile = profileRow[0]
  if (!profile) {
    redirect('/login')
  }

  const user = {
    email: profile.email,
    role: profile.role,
    emailVerifiedAt: profile.emailVerifiedAt?.toISOString() ?? null,
    profile: {
      avatarUrl: profile.avatarUrl,
      name: profile.name,
      bio: profile.bio,
      isPublic: profile.isPublic,
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

  return (
    <div className="max-w-lg space-y-4">
      <ProfilePageHeader />
      <ProfileSummaryCard user={user} />
      <AchievementBadges
        badges={badgeRows as Achievement[]}
        labels={badgeLabels}
        title={t('achievements_title')}
        emptyLabel={t('achievements_empty')}
        caption={t('achievements_caption')}
      />
      <PointsBadge />
      {!profile.emailVerifiedAt && <ProfileEmailWarning />}
      <DangerZone />
    </div>
  )
}
