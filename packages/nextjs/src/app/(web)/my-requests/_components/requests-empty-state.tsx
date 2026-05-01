'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

type Role = 'requester' | 'owner'

export function RequestsEmptyState({ role }: { role: Role }) {
  const t = useTranslations('my_requests')

  return (
    <div className="text-center py-16 text-gray-400">
      <p className="text-base">
        {role === 'requester' ? t('empty_sent') : t('empty_received')}
      </p>
      {role === 'requester' && (
        <Link
          href="/skills"
          className="mt-4 inline-block text-sm text-green-700 hover:underline"
        >
          {t('browse_skills')}
        </Link>
      )}
    </div>
  )
}
