import Link from 'next/link'
import { querySkills } from '@/lib/queries/skills'
import { queryCategories } from '@/lib/queries/categories'
import { queryLocations } from '@/lib/queries/locations'
import { EmptyState, ErrorState } from '@/components/ui/async-states'

export const dynamic = 'force-dynamic'

interface Skill {
  id: string
  title: string
  description: string | null
  status: string
  availableHours: number | null
  imageUrl: string | null
  ownerName: string | null
  categoryLabel: string | null
  locationNeighborhood: string | null
  locationCity: string | null
}

const PAGE_SIZE = 20

export default async function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; categoryId?: string; locationId?: string; page?: string }>
}) {
  const { status, search, categoryId, locationId, page: rawPage } = await searchParams
  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)

  let skills: Skill[] = []
  let fetchError = false
  let categories: { id: string; slug: string; label: string }[] = []
  let locations: { id: string; city: string; neighborhood: string }[] = []

  try {
    ;[skills, categories, locations] = await Promise.all([
      querySkills({ status, search, categoryId, locationId, limit: PAGE_SIZE, page }),
      queryCategories(),
      queryLocations(),
    ])
  } catch {
    fetchError = true
  }

  // Build query string helper preserving other params.
  // page is always reset to 1 unless explicitly passed in overrides.
  function buildHref(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams()
    const merged = { status, search, categoryId, locationId, page: undefined, ...overrides }
    for (const [k, v] of Object.entries(merged)) {
      if (v) params.set(k, v)
    }
    const qs = params.toString()
    return qs ? `/skills?${qs}` : '/skills'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Skills</h1>
        <Link
          href="/skills/new"
          className="bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors"
        >
          + Offer a skill
        </Link>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Text search */}
        <form method="GET" action="/skills" className="flex-1 min-w-48">
          <div className="relative">
            <input
              name="search"
              type="text"
              defaultValue={search ?? ''}
              placeholder="Search skills…"
              maxLength={100}
              className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            {/* Preserve other params */}
            {status && <input type="hidden" name="status" value={status} />}
            {categoryId && <input type="hidden" name="categoryId" value={categoryId} />}
            {locationId && <input type="hidden" name="locationId" value={locationId} />}
          </div>
        </form>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 items-center">
          <Link
            href={buildHref({ categoryId: undefined })}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              !categoryId
                ? 'bg-green-700 text-white border-green-700'
                : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
            }`}
          >
            All categories
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={buildHref({ categoryId: c.id })}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                categoryId === c.id
                  ? 'bg-green-700 text-white border-green-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
              }`}
            >
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Location filter */}
      {locations.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Link
            href={buildHref({ locationId: undefined })}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              !locationId
                ? 'bg-green-700 text-white border-green-700'
                : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
            }`}
          >
            All locations
          </Link>
          {locations.map((l) => (
            <Link
              key={l.id}
              href={buildHref({ locationId: l.id })}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                locationId === l.id
                  ? 'bg-green-700 text-white border-green-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
              }`}
            >
              {l.neighborhood}, {l.city}
            </Link>
          ))}
        </div>
      )}

      {/* Status filter */}
      <div className="flex gap-2 mb-6">
        {[
          { label: 'All', value: undefined },
          { label: 'Available', value: 'available' },
          { label: 'Busy', value: 'busy' },
        ].map(({ label, value }) => (
          <Link
            key={label}
            href={buildHref({ status: value })}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              status === value
                ? 'bg-green-700 text-white border-green-700'
                : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {fetchError ? (
        <ErrorState title="Could not load skills." message="Please try refreshing the page." />
      ) : skills.length === 0 ? (
        <EmptyState
          title="No skills found."
          message={search || categoryId || locationId || status ? undefined : 'Be the first to offer a skill in your neighborhood.'}
          actionLabel={search || categoryId || locationId || status ? 'Clear filters' : undefined}
          actionHref={search || categoryId || locationId || status ? '/skills' : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <Link
              key={skill.id}
              href={`/skills/${skill.id}`}
              className="block bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-green-400 hover:shadow-sm transition-all"
            >
              {skill.imageUrl && (
                <img
                  src={skill.imageUrl}
                  alt={skill.title}
                  className="w-full h-36 object-cover"
                />
              )}
              <div className="p-4">
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
                  {skill.availableHours != null && <span>{skill.availableHours}h/week</span>}
                </div>

                {skill.ownerName && (
                  <p className="text-xs text-gray-400 mt-2">by {skill.ownerName}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!fetchError && (skills.length === PAGE_SIZE || page > 1) && (
        <div className="flex justify-between mt-6 text-sm">
          {page > 1
            ? <Link href={buildHref({ page: String(page - 1) })} className="text-green-700 hover:underline">← Previous</Link>
            : <span />}
          {skills.length === PAGE_SIZE
            ? <Link href={buildHref({ page: String(page + 1) })} className="text-green-700 hover:underline">Next →</Link>
            : <span />}
        </div>
      )}
    </div>
  )
}
