import Link from 'next/link'
import { BuildHref } from './types'

type SkillsPaginationProps = {
  page: number
  canGoNext: boolean
  buildHref: BuildHref
}

export function SkillsPagination({ page, canGoNext, buildHref }: SkillsPaginationProps) {
  if (!canGoNext && page <= 1) return null

  return (
    <div className="flex justify-between mt-6 text-sm">
      {page > 1 ? (
        <Link href={buildHref({ page: String(page - 1) })} className="text-green-700 hover:underline">
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      {canGoNext ? (
        <Link href={buildHref({ page: String(page + 1) })} className="text-green-700 hover:underline">
          Next →
        </Link>
      ) : (
        <span />
      )}
    </div>
  )
}
