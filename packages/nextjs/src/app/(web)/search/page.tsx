import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ListPageSkeleton } from '@/components/ui/skeletons'
import { SearchResultsView } from './_components/search-results-view'

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search for skills, tools, events, drives, and food shares across your neighborhood.',
}

type SearchPageProps = {
  searchParams: Promise<{
    q?: string
    type?: string
    locationId?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams

  return (
    <div className="mx-auto max-w-5xl">
      <Suspense fallback={<ListPageSkeleton />}>
        <SearchResultsView
          key={`${params.q ?? ''}|${params.type ?? 'all'}|${params.locationId ?? ''}`}
          initialQuery={params.q ?? ''}
          initialType={params.type ?? 'all'}
          initialLocationId={params.locationId}
        />
      </Suspense>
    </div>
  )
}
