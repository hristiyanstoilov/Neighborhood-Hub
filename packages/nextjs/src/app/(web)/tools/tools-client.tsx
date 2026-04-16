'use client'

import Link from 'next/link'
import { EmptyState, ErrorState } from '@/components/ui/async-states'
import { ToolsFilters } from './_components/tools-filters'
import { ToolsGrid } from './_components/tools-grid'
import { ToolsPagination } from './_components/tools-pagination'
import { buildToolsHref, type ToolListFilters } from './_hooks/tools-contract'
import { useToolsList, type ToolsPage } from './_hooks/use-tools-list'

const PAGE_SIZE = 20

type Category = { id: string; slug: string; label: string }
type Location = { id: string; city: string; neighborhood: string }

type ToolsClientProps = ToolListFilters & {
  categories: Category[]
  locations: Location[]
  initialData?: ToolsPage
}

export function ToolsClient({
  status,
  search,
  categoryId,
  locationId,
  page,
  categories,
  locations,
  initialData,
}: ToolsClientProps) {
  const query = useToolsList({ status, search, categoryId, locationId, page }, initialData)
  const tools = query.data?.tools ?? []
  const total = query.data?.total ?? 0
  const canGoNext = total > page * PAGE_SIZE

  const buildHref = (overrides: Record<string, string | undefined>) =>
    buildToolsHref({ status, search, categoryId, locationId }, overrides)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tool Library</h1>
        <Link
          href="/tools/new"
          className="bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors"
        >
          + List a tool
        </Link>
      </div>

      <ToolsFilters
        status={status}
        search={search}
        categoryId={categoryId}
        locationId={locationId}
        categories={categories}
        locations={locations}
        buildHref={buildHref}
      />

      {query.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-48 animate-pulse" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState
          title="Could not load tools."
          message="Please try again."
          actionLabel="Try again"
          actionHref={buildHref({})}
        />
      ) : tools.length === 0 ? (
        <EmptyState
          title="No tools found."
          message={
            status || search || categoryId || locationId
              ? undefined
              : 'Be the first to list a tool in your neighborhood.'
          }
          actionLabel={status || search || categoryId || locationId ? 'Clear filters' : undefined}
          actionHref={status || search || categoryId || locationId ? '/tools' : undefined}
        />
      ) : (
        <ToolsGrid tools={tools} />
      )}

      {!query.isError && (
        <ToolsPagination page={page} canGoNext={canGoNext} buildHref={buildHref} />
      )}
    </div>
  )
}
