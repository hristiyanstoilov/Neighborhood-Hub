'use client'

import { useTranslations } from 'next-intl'

type FlagButtonProps = {
  entityType: string
  entityId: string
}

const REPORT_EMAIL = 'moderation@neighborhoodhub.bg'

export function FlagButton({ entityType, entityId }: FlagButtonProps) {
  const t = useTranslations('common')

  function handleFlag() {
    const subject = `Neighborhood Hub report: ${entityType} ${entityId}`
    const body = [
      `Please review this ${entityType}.`,
      '',
      `Entity type: ${entityType}`,
      `Entity ID: ${entityId}`,
      '',
      'Reason:',
    ].join('\n')

    window.location.href = `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <button
      type="button"
      onClick={handleFlag}
      className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
      aria-label={t('report')}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 4v16" />
        <path d="M4 4h11l-1 5 1 5H4" />
      </svg>
      <span>{t('report')}</span>
    </button>
  )
}