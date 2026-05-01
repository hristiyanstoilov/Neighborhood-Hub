'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

type RequestCardHeaderProps = {
  skillId: string
  skillTitle: string
  isOwner: boolean
  otherName: string | null
  status: string
  statusClassName: string
}

export function RequestCardHeader({
  skillId,
  skillTitle,
  isOwner,
  otherName,
  status,
  statusClassName,
}: RequestCardHeaderProps) {
  const t = useTranslations('my_requests')
  const tCommon = useTranslations('common')

  const statusLabels: Record<string, string> = {
    pending:   tCommon('status.pending'),
    accepted:  t('status_accepted'),
    rejected:  tCommon('status.rejected'),
    completed: tCommon('status.completed'),
    cancelled: tCommon('status.cancelled'),
  }

  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div>
        <Link
          href={`/skills/${skillId}`}
          className="font-semibold text-gray-900 hover:text-green-700 transition-colors"
        >
          {skillTitle}
        </Link>
        <p className="text-sm text-gray-500 mt-0.5">
          {isOwner ? t('from') : t('to')}: {otherName ?? t('unknown_user')}
        </p>
      </div>
      <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-medium ${statusClassName}`}>
        {statusLabels[status] ?? status}
      </span>
    </div>
  )
}
