import type { ReactNode } from 'react'

type SearchResultsGridProps = {
  children: ReactNode
}

export function SearchResultsGrid({ children }: SearchResultsGridProps) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
}
