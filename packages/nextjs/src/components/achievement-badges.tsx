import { BADGE_TYPES, type BadgeType } from '@/lib/badges'

export type Achievement = {
  type: BadgeType
  awardedAt: Date
}

type AchievementBadgesProps = {
  badges: Achievement[]
  labels: Record<BadgeType, string>
  criteria: Record<BadgeType, string>
  title: string
  emptyLabel: string
  caption: string
}

const BADGE_STYLES: Record<BadgeType, string> = {
  first_skill:    'border-emerald-200 bg-emerald-50 text-emerald-800',
  first_tool:     'border-sky-200 bg-sky-50 text-sky-800',
  first_food:     'border-orange-200 bg-orange-50 text-orange-800',
  ten_points:     'border-violet-200 bg-violet-50 text-violet-800',
  fifty_points:   'border-amber-200 bg-amber-50 text-amber-900',
  five_star_giver:'border-rose-200 bg-rose-50 text-rose-800',
  community_hero: 'border-teal-200 bg-teal-50 text-teal-800',
  first_event:    'border-indigo-200 bg-indigo-50 text-indigo-800',
  first_drive:    'border-cyan-200 bg-cyan-50 text-cyan-800',
  good_neighbor:  'border-lime-200 bg-lime-50 text-lime-800',
  tool_master:    'border-yellow-200 bg-yellow-50 text-yellow-800',
}

const BADGE_DOTS: Record<BadgeType, string> = {
  first_skill:    'bg-emerald-500',
  first_tool:     'bg-sky-500',
  first_food:     'bg-orange-500',
  ten_points:     'bg-violet-500',
  fifty_points:   'bg-amber-500',
  five_star_giver:'bg-rose-500',
  community_hero: 'bg-teal-500',
  first_event:    'bg-indigo-500',
  first_drive:    'bg-cyan-500',
  good_neighbor:  'bg-lime-500',
  tool_master:    'bg-yellow-500',
}

export function AchievementBadges({ badges, labels, criteria, title, emptyLabel, caption }: AchievementBadgesProps) {
  const earned = new Set(badges.map((b) => b.type))
  const earnedSorted = [...badges].sort((a, b) => b.awardedAt.getTime() - a.awardedAt.getTime())
  const locked = BADGE_TYPES.filter((t) => !earned.has(t))

  return (
    <section className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <span className="text-xs font-medium text-gray-500">{earnedSorted.length} / {BADGE_TYPES.length}</span>
      </div>

      {earnedSorted.length === 0 && locked.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
          {emptyLabel}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {earnedSorted.map((badge) => (
            <div
              key={`${badge.type}-${badge.awardedAt.toISOString()}`}
              className={`rounded-xl border px-4 py-3 shadow-sm ${BADGE_STYLES[badge.type]}`}
            >
              <div className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${BADGE_DOTS[badge.type]}`} />
                <div>
                  <p className="text-sm font-semibold">{labels[badge.type]}</p>
                  <p className="text-xs opacity-80">{caption}</p>
                </div>
              </div>
            </div>
          ))}

          {locked.map((type) => (
            <div
              key={type}
              className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-gray-300" />
                <div>
                  <p className="text-sm font-semibold text-gray-400">{labels[type]}</p>
                  <p className="text-xs text-gray-400">{criteria[type]}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
