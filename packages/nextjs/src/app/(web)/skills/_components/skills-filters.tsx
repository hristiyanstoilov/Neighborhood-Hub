import Link from 'next/link'
import { BuildHref } from './types'

type SkillsFiltersProps = {
  status?: string
  search?: string
  categoryId?: string
  locationId?: string
  categories: { id: string; slug: string; label: string }[]
  locations: { id: string; city: string; neighborhood: string }[]
  buildHref: BuildHref
}

export function SkillsFilters({
  status,
  search,
  categoryId,
  locationId,
  categories,
  locations,
  buildHref,
}: SkillsFiltersProps) {
  return (
    <>
      <div className="flex flex-wrap gap-3 mb-6">
        <form method="GET" action="/skills" className="flex-1 min-w-48" role="search" aria-label="Search skills">
          <label htmlFor="skill-search" className="sr-only">
            Search skills
          </label>
          <div className="relative">
            <input
              id="skill-search"
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
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            {status && <input type="hidden" name="status" value={status} />}
            {categoryId && <input type="hidden" name="categoryId" value={categoryId} />}
            {locationId && <input type="hidden" name="locationId" value={locationId} />}
          </div>
        </form>

        <div className="flex flex-wrap gap-2 items-center" aria-label="Category filters">
          <Link
            href={buildHref({ categoryId: undefined })}
            aria-current={!categoryId ? 'page' : undefined}
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
              aria-current={categoryId === c.id ? 'page' : undefined}
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

      {locations.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4" aria-label="Location filters">
          <Link
            href={buildHref({ locationId: undefined })}
            aria-current={!locationId ? 'page' : undefined}
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
              aria-current={locationId === l.id ? 'page' : undefined}
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

      <div className="flex gap-2 mb-6" aria-label="Status filters">
        {[
          { label: 'All', value: undefined },
          { label: 'Available', value: 'available' },
          { label: 'Busy', value: 'busy' },
        ].map(({ label, value }) => (
          <Link
            key={label}
            href={buildHref({ status: value })}
            aria-current={status === value ? 'page' : undefined}
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
    </>
  )
}
