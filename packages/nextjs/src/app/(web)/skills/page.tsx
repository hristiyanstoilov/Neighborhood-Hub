import Link from 'next/link'
import { querySkills } from '@/lib/queries/skills'
import { queryCategories } from '@/lib/queries/categories'
import { queryLocations } from '@/lib/queries/locations'
import { EmptyState, ErrorState } from '@/components/ui/async-states'
import { SkillsFilters } from './_components/skills-filters'
import { SkillsGrid } from './_components/skills-grid'
import { SkillsPagination } from './_components/skills-pagination'
import { Skill } from './_components/types'

export const dynamic = 'force-dynamic'

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

      <SkillsFilters
        status={status}
        search={search}
        categoryId={categoryId}
        locationId={locationId}
        categories={categories}
        locations={locations}
        buildHref={buildHref}
      />

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
        <SkillsGrid skills={skills} />
      )}

      {!fetchError && (
        <SkillsPagination page={page} canGoNext={skills.length === PAGE_SIZE} buildHref={buildHref} />
      )}
    </div>
  )
}
