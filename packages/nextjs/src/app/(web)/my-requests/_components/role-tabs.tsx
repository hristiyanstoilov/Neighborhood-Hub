'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

type Role = 'requester' | 'owner'

function tabClass(active: boolean) {
  return `px-4 py-2 text-sm font-medium rounded-md transition-colors ${
    active
      ? 'bg-green-700 text-white'
      : 'text-gray-600 border border-gray-300 hover:bg-gray-50'
  }`
}

export function RoleTabs({ role }: { role: Role }) {
  const t = useTranslations('my_requests')

  return (
    <div role="tablist" aria-label={t('tab_aria_label')} className="flex gap-2 mb-6">
      <Link
        href="/my-requests?role=requester"
        role="tab"
        aria-selected={role === 'requester'}
        className={tabClass(role === 'requester')}
      >
        {t('tab_sent')}
      </Link>
      <Link
        href="/my-requests?role=owner"
        role="tab"
        aria-selected={role === 'owner'}
        className={tabClass(role === 'owner')}
      >
        {t('tab_received')}
      </Link>
    </div>
  )
}
