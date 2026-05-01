import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { BuildHref } from './types'

type ToolsPaginationProps = {
  page: number
  canGoNext: boolean
  buildHref: BuildHref
}

export function ToolsPagination({ page, canGoNext, buildHref }: ToolsPaginationProps) {
  const t = useTranslations('tools')
  if (!canGoNext && page <= 1) return null

  return (
    <nav aria-label="Pagination" className="flex justify-between mt-6 text-sm">
      {page > 1 ? (
        <Link
          href={buildHref({ page: String(page - 1) })}
          aria-label={t('prev')}
          className="text-green-700 hover:underline"
        >
          {t('prev')}
        </Link>
      ) : (
        <span />
      )}
      {canGoNext ? (
        <Link
          href={buildHref({ page: String(page + 1) })}
          aria-label={t('next')}
          className="text-green-700 hover:underline"
        >
          {t('next')}
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}
