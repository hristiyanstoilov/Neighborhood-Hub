import type { BadgeType } from '@/lib/badges'

export type Achievement = {
  type: BadgeType
  awardedAt: Date
}

type AchievementBadgesProps = {
  badges: Achievement[]
  labels: Record<BadgeType, string>
  title: string
  emptyLabel: string
  caption: string
}

const BADGE_STYLES: Record<BadgeType, string> = {
  first_skill: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  first_tool: 'border-sky-200 bg-sky-50 text-sky-800',
  first_food: 'border-orange-200 bg-orange-50 text-orange-800',
  ten_points: 'border-violet-200 bg-violet-50 text-violet-800',
  fifty_points: 'border-amber-200 bg-amber-50 text-amber-900',
  five_star_giver: 'border-rose-200 bg-rose-50 text-rose-800',
  community_hero: 'border-teal-200 bg-teal-50 text-teal-800',
}

const BADGE_DOTS: Record<BadgeType, string> = {
  first_skill: 'bg-emerald-500',
  first_tool: 'bg-sky-500',
  first_food: 'bg-orange-500',
  ten_points: 'bg-violet-500',
  fifty_points: 'bg-amber-500',
  five_star_giver: 'bg-rose-500',
  community_hero: 'bg-teal-500',
}

export function AchievementBadges({ badges, labels, title, emptyLabel, caption }: AchievementBadgesProps) {
  const orderedBadges = [...badges].sort((left, right) => right.awardedAt.getTime() - left.awardedAt.getTime())

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <span className="text-xs font-medium text-gray-500">{orderedBadges.length}</span>
      </div>

      {orderedBadges.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {orderedBadges.map((badge) => (
            <div
              key={`${badge.type}-${badge.awardedAt.toISOString()}`}
              className={`rounded-xl border px-4 py-3 shadow-sm ${BADGE_STYLES[badge.type]}`}
            >
              <div className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${BADGE_DOTS[badge.type]}`} />
                <div>
                  <p className="text-sm font-semibold">{labels[badge.type]}</p>
                  <p className="text-xs opacity-80">{caption}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
          {emptyLabel}
        </div>
      )}
    </section>
  )
}
