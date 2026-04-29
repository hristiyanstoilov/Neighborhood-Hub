'use client'

import { useTranslations } from 'next-intl'

type CancelReasonFormProps = {
  value: string
  loading: boolean
  onChange: (value: string) => void
  onConfirm: () => void
  onBack: () => void
}

export function CancelReasonForm({ value, loading, onChange, onConfirm, onBack }: CancelReasonFormProps) {
  const t = useTranslations('my_requests')
  const tCommon = useTranslations('common')

  return (
    <div className="mt-3 space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        maxLength={500}
        placeholder={t('cancel_reason_placeholder')}
        aria-label={t('cancel_reason_aria')}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading || !value.trim()}
          className="bg-red-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {t('cancel_confirm')}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-1.5 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          {tCommon('back')}
        </button>
      </div>
    </div>
  )
}
