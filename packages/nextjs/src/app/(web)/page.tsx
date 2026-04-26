import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { getTranslations } from 'next-intl/server'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { querySkills } from '@/lib/queries/skills'
import { queryRadarLocations } from '@/lib/queries/locations'
import { db } from '@/db'
import { skills } from '@/db/schema'
import { isNull, sql } from 'drizzle-orm'
import { FeaturesSection } from '@/components/landing/features-section'
import { HowItWorks } from '@/components/landing/how-it-works'
import { AppIcon, type AppIconName } from '@/components/ui/app-icon'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Neighborhood Hub — Share Skills, Tools & Time',
  description: 'Connect with your neighbors to share skills, borrow tools, join events, share food, and support community drives.',
}

type SkillPreview = {
  id: string
  title: string
  description: string | null
  status: string
  imageUrl: string | null
  ownerName: string | null
  categoryLabel: string | null
  locationNeighborhood: string | null
  locationCity: string | null
  availableHours: number | null
}

export default async function HomePage() {
  const t = await getTranslations('landing')
  const tMod = await getTranslations('modules')
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  const user = refreshToken ? await queryUserByRefreshToken(refreshToken) : null

  // Fetch stats + preview skills + radar in parallel
  let skillCount = 0
  let recentSkills: SkillPreview[] = []
  let radarLocations: { id: string; neighborhood: string; city: string; skillCount: number }[] = []

  try {
    const [countResult, skillRows, radarRows] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(skills).where(isNull(skills.deletedAt)),
      querySkills({ limit: 6 }),
      queryRadarLocations(),
    ])
    skillCount = countResult[0]?.count ?? 0
    recentSkills = skillRows
    radarLocations = radarRows
  } catch {
    // non-critical — page still renders without stats
  }

  if (!user) {
    // ── Guest landing page ────────────────────────────────────────────────────
    return (
      <div>
        {/* Hero */}
        <div className="text-center py-20">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            {t('hero_title')}
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto">
            {t('hero_subtitle')}
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/register" className="bg-green-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-800 transition-colors">{t('cta_start')}</Link>
            <Link href="/skills" className="px-6 py-3 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">{t('cta_browse')}</Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-y border-gray-100 py-6 mb-12">
          <p className="text-center text-sm text-gray-400">
            {t('stats', { count: skillCount })}
          </p>
        </div>

        {/* Features */}
        <FeaturesSection />

        {/* How it works */}
        <HowItWorks />

        {/* Recent skills preview */}
        {recentSkills.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">{t('recently_added')}</h2>
              <Link href="/skills" className="text-sm text-green-700 hover:underline">{t('view_all')}</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentSkills.map((skill) => (
                <Link
                  key={skill.id}
                  href={`/skills/${skill.id}`}
                  className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-green-400 hover:shadow-sm transition-all"
                >
                  {skill.imageUrl && (
                    <Image
                      src={skill.imageUrl}
                      alt={skill.title}
                      width={640}
                      height={224}
                      unoptimized
                      className="w-full h-28 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">{skill.title}</h3>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                        skill.status === 'available' ? 'bg-green-100 text-green-700'
                        : skill.status === 'busy' ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-500'
                      }`}>{skill.status}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {skill.categoryLabel && <span>{skill.categoryLabel}</span>}
                      {skill.categoryLabel && skill.ownerName && <span> · </span>}
                      {skill.ownerName && <span>by {skill.ownerName}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Logged-in dashboard ───────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('welcome_back')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('stats', { count: skillCount })}</p>
        </div>
        <Link
          href="/skills/new"
          className="bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors"
        >
          {t('offer_skill')}
        </Link>
      </div>

      {/* Browse modules */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('browse')}</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { href: '/skills',  label: tMod('skills'),  icon: 'skills' as AppIconName },
            { href: '/tools',   label: tMod('tools'),   icon: 'tools' as AppIconName },
            { href: '/events',  label: tMod('events'),  icon: 'events' as AppIconName },
            { href: '/drives',  label: tMod('drives'),  icon: 'drives' as AppIconName },
            { href: '/food',    label: tMod('food'),    icon: 'food' as AppIconName },
            { href: '/radar',   label: tMod('radar'),   icon: 'radar' as AppIconName },
          ].map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="bg-white rounded-lg border border-gray-200 p-3 text-center hover:border-green-400 hover:shadow-sm transition-all"
            >
              <div className="mb-1 inline-flex rounded-full bg-emerald-50 p-2 text-emerald-700">
                <AppIcon name={icon} size={18} />
              </div>
              <p className="text-xs font-medium text-gray-700">{label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* My Activity */}
      <div className="mb-10">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{t('my_activity')}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: '/my-requests',       label: t('my_requests'),            icon: 'requests' as AppIconName },
            { href: '/my-reservations',   label: t('my_tool_reservations'),   icon: 'reservations' as AppIconName },
            { href: '/food/reservations', label: t('my_food_reservations'),   icon: 'food' as AppIconName },
            { href: '/my-events',         label: t('my_events'),              icon: 'events' as AppIconName },
            { href: '/my-drives',         label: t('my_pledges'),             icon: 'pledge' as AppIconName },
            { href: '/profile',           label: tMod('profile'),             icon: 'profile' as AppIconName },
          ].map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="bg-white rounded-lg border border-gray-200 p-3 text-center hover:border-green-400 hover:shadow-sm transition-all"
            >
              <div className="mb-1 inline-flex rounded-full bg-emerald-50 p-2 text-emerald-700">
                <AppIcon name={icon} size={18} />
              </div>
              <p className="text-xs font-medium text-gray-700">{label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Radar widget */}
      {radarLocations.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">{t('radar_title')}</h2>
            <Link href="/radar" className="text-sm text-green-700 hover:underline">{t('radar_link')}</Link>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-wrap gap-2">
              {radarLocations
                .filter((l) => l.skillCount > 0)
                .sort((a, b) => b.skillCount - a.skillCount)
                .slice(0, 8)
                .map((loc) => (
                  <Link
                    key={loc.id}
                    href={`/skills?locationId=${loc.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-colors text-sm"
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        loc.skillCount >= 8 ? 'bg-green-700'
                        : loc.skillCount >= 3 ? 'bg-green-500'
                        : 'bg-green-300'
                      }`}
                    />
                    <span className="text-gray-700 font-medium">{loc.neighborhood}</span>
                    <span className="text-gray-400 text-xs">{loc.skillCount}</span>
                  </Link>
                ))}
            </div>
            {radarLocations.filter((l) => l.skillCount === 0).length > 0 && (
              <p className="text-xs text-gray-400 mt-3">
                {t('neighborhoods_empty', { count: radarLocations.filter((l) => l.skillCount === 0).length })}{' '}
                <Link href="/skills/new" className="text-green-700 hover:underline">{t('be_first')}</Link>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recent skills */}
      {recentSkills.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">{t('recently_added_skills')}</h2>
            <Link href="/skills" className="text-sm text-green-700 hover:underline">{t('view_all')}</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentSkills.map((skill) => (
              <Link
                key={skill.id}
                href={`/skills/${skill.id}`}
                className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-green-400 hover:shadow-sm transition-all"
              >
                {skill.imageUrl && (
                  <Image
                    src={skill.imageUrl}
                    alt={skill.title}
                    width={640}
                    height={224}
                    unoptimized
                    className="w-full h-28 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">{skill.title}</h3>
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                      skill.status === 'available' ? 'bg-green-100 text-green-700'
                      : skill.status === 'busy' ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-500'
                    }`}>{skill.status}</span>
                  </div>
                  {skill.description && (
                    <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{skill.description}</p>
                  )}
                  <div className="text-xs text-gray-400 mt-1.5">
                    {skill.categoryLabel && <span>{skill.categoryLabel}</span>}
                    {skill.categoryLabel && skill.locationNeighborhood && <span> · </span>}
                    {skill.locationNeighborhood && <span>{skill.locationNeighborhood}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
