import Link from 'next/link'
import { BuildHref } from './types'

type ToolsPaginationProps = {
  page: number
  canGoNext: boolean
  buildHref: BuildHref
}

export function ToolsPagination({ page, canGoNext, buildHref }: ToolsPaginationProps) {
  if (!canGoNext && page <= 1) return null

  return (
    <nav aria-label="Pagination" className="flex justify-between mt-6 text-sm">
      {page > 1 ? (
        <Link
          href={buildHref({ page: String(page - 1) })}
          aria-label="Previous page"
          className="text-green-700 hover:underline"
        >
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      {canGoNext ? (
        <Link
          href={buildHref({ page: String(page + 1) })}
          aria-label="Next page"
          className="text-green-700 hover:underline"
        >
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}
