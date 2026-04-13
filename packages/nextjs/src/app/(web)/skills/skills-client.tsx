'use client'

import Link from 'next/link'
import { EmptyState, ErrorState } from '@/components/ui/async-states'
import { SkillsFilters } from './_components/skills-filters'
import { SkillsGrid } from './_components/skills-grid'
import { SkillsPagination } from './_components/skills-pagination'
import { SkillsLoadingState } from './_components/skills-loading-state'
import { buildSkillsHref } from './_hooks/skills-contract'
import { useSkillsList, type SkillListFilters, type SkillsPage } from './_hooks/use-skills-list'

const PAGE_SIZE = 20

type Category = { id: string; slug: string; label: string }
type Location = { id: string; city: string; neighborhood: string }

type SkillsClientProps = SkillListFilters & {
  categories: Category[]
  locations: Location[]
  initialData?: SkillsPage
}

export function SkillsClient({
  status,
  search,
  categoryId,
  locationId,
  page,
  categories,
  locations,
  initialData,
}: SkillsClientProps) {
  const query = useSkillsList({ status, search, categoryId, locationId, page }, initialData)
  const skills = query.data?.skills ?? []
  const total = query.data?.total ?? 0
  const canGoNext = total > page * PAGE_SIZE

  const buildHref = (overrides: Record<string, string | undefined>) =>
    buildSkillsHref({ status, search, categoryId, locationId }, overrides)

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

      {query.isLoading ? (
        <SkillsLoadingState />
      ) : query.isError ? (
        <ErrorState
          title="Could not load skills."
          message="Please try again."
          actionLabel="Try again"
          actionHref={buildHref({})}
        />
      ) : skills.length === 0 ? (
        <EmptyState
          title="No skills found."
          message={status || search || categoryId || locationId ? undefined : 'Be the first to offer a skill in your neighborhood.'}
          actionLabel={status || search || categoryId || locationId ? 'Clear filters' : undefined}
          actionHref={status || search || categoryId || locationId ? '/skills' : undefined}
        />
      ) : (
        <SkillsGrid skills={skills} />
      )}

      {!query.isError && (
        <SkillsPagination page={page} canGoNext={canGoNext} buildHref={buildHref} />
      )}
    </div>
  )
}
