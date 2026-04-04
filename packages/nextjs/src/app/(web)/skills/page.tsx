import Link from 'next/link'

type FetchResult = { ok: true; data: Skill[] } | { ok: false }

interface Skill {
  id: string
  title: string
  description: string | null
  status: string
  availableHours: number
  ownerName: string | null
  categoryLabel: string | null
  locationNeighborhood: string | null
  locationCity: string | null
}

async function getSkills(status?: string): Promise<FetchResult> {
  try {
    const params = new URLSearchParams({ limit: '20' })
    if (status) params.set('status', status)
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/skills?${params}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return { ok: false }
    const json = await res.json()
    return { ok: true, data: json.data ?? [] }
  } catch {
    return { ok: false }
  }
}

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const result = await getSkills(status)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Skills</h1>
        <Link
          href="/skills/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Offer a skill
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-6">
        {[
          { label: 'All', value: undefined },
          { label: 'Available', value: 'available' },
          { label: 'Busy', value: 'busy' },
        ].map(({ label, value }) => (
          <Link
            key={label}
            href={value ? `/skills?status=${value}` : '/skills'}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              status === value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {!result.ok ? (
        <div className="text-center py-24 text-gray-500">
          <p className="text-lg mb-2">Could not load skills.</p>
          <p className="text-sm">Please try refreshing the page.</p>
        </div>
      ) : result.data.length === 0 ? (
        <div className="text-center py-24 text-gray-500">
          <p className="text-lg mb-2">No skills found.</p>
          <p className="text-sm">Be the first to offer a skill in your neighborhood.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.data.map((skill) => (
            <Link
              key={skill.id}
              href={`/skills/${skill.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h2 className="font-semibold text-gray-900 line-clamp-2">{skill.title}</h2>
                <span
                  className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                    skill.status === 'available'
                      ? 'bg-green-100 text-green-700'
                      : skill.status === 'busy'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {skill.status}
                </span>
              </div>

              {skill.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{skill.description}</p>
              )}

              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                {skill.categoryLabel && <span>{skill.categoryLabel}</span>}
                {skill.locationNeighborhood && (
                  <span>{skill.locationNeighborhood}, {skill.locationCity}</span>
                )}
                <span>{skill.availableHours}h/week</span>
              </div>

              {skill.ownerName && (
                <p className="text-xs text-gray-400 mt-2">by {skill.ownerName}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
