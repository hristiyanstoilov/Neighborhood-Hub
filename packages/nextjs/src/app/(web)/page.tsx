import Link from 'next/link'
import { cookies } from 'next/headers'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { querySkills } from '@/lib/queries/skills'
import { db } from '@/db'
import { skills } from '@/db/schema'
import { isNull, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

type SkillPreview = {
  id: string
  title: string
  description: string | null
  status: string
  ownerName: string | null
  categoryLabel: string | null
  locationNeighborhood: string | null
  locationCity: string | null
  availableHours: number | null
}

export default async function HomePage() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  const user = refreshToken ? await queryUserByRefreshToken(refreshToken) : null

  // Fetch stats + preview skills in parallel
  let skillCount = 0
  let recentSkills: SkillPreview[] = []

  try {
    const [countResult, skillRows] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(skills).where(isNull(skills.deletedAt)),
      querySkills({ limit: 6 }),
    ])
    skillCount = countResult[0]?.count ?? 0
    recentSkills = skillRows
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
            Share skills with your<br />neighborhood
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-md mx-auto">
            Offer what you know. Find what you need. Connect with people nearby.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/register"
              className="bg-green-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-800 transition-colors"
            >
              Get started
            </Link>
            <Link
              href="/skills"
              className="px-6 py-3 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Browse skills
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-y border-gray-100 py-6 mb-12">
          <p className="text-center text-sm text-gray-400">
            <span className="font-semibold text-gray-700">{skillCount}</span> skill{skillCount !== 1 ? 's' : ''} available in your community
          </p>
        </div>

        {/* Recent skills preview */}
        {recentSkills.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Recently added</h2>
              <Link href="/skills" className="text-sm text-green-700 hover:underline">View all →</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentSkills.map((skill) => (
                <Link
                  key={skill.id}
                  href={`/skills/${skill.id}`}
                  className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-green-400 hover:shadow-sm transition-all"
                >
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
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, <span className="text-green-700">neighbor</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {skillCount} skill{skillCount !== 1 ? 's' : ''} available in your community
          </p>
        </div>
        <Link
          href="/skills/new"
          className="bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors"
        >
          + Offer a skill
        </Link>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[
          { href: '/skills', label: 'Browse Skills', icon: '🔍' },
          { href: '/my-requests', label: 'My Requests', icon: '📋' },
          { href: '/profile', label: 'Profile', icon: '👤' },
          { href: '/skills/new', label: 'Offer Skill', icon: '✨' },
        ].map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-lg border border-gray-200 p-4 text-center hover:border-green-400 hover:shadow-sm transition-all"
          >
            <div className="text-2xl mb-1">{icon}</div>
            <p className="text-sm font-medium text-gray-700">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent skills */}
      {recentSkills.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recently added skills</h2>
            <Link href="/skills" className="text-sm text-green-700 hover:underline">View all →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentSkills.map((skill) => (
              <Link
                key={skill.id}
                href={`/skills/${skill.id}`}
                className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-green-400 hover:shadow-sm transition-all"
              >
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
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
