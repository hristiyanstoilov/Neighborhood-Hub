import { SearchResultsView } from './_components/search-results-view'

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
      <SearchResultsView
        initialQuery={params.q ?? ''}
        initialType={params.type ?? 'all'}
        initialLocationId={params.locationId}
      />
    </div>
  )
}
