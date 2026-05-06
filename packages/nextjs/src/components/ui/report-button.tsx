'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/auth'

type TargetType = 'skill' | 'tool' | 'event' | 'food' | 'drive' | 'user' | 'message'
type Reason = 'spam' | 'inappropriate' | 'misleading' | 'dangerous' | 'other'

interface Props {
  targetType: TargetType
  targetId: string
}

const REASONS: Reason[] = ['spam', 'inappropriate', 'misleading', 'dangerous', 'other']

export function ReportButton({ targetType, targetId }: Props) {
  const t = useTranslations('common')
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<Reason>('spam')
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!user) return null

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      const res = await apiFetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, reason, details: details.trim() || undefined }),
      })
      if (res.status === 409) { setDone(true); setOpen(false); return }
      if (!res.ok) throw new Error()
      setDone(true)
      setOpen(false)
    } catch {
      setError(t('report_failed'))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return <span className="text-xs text-gray-400">{t('report_sent')}</span>
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
      >
        {t('report')}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-sm rounded-xl bg-white border border-gray-200 shadow-xl p-5 space-y-4"
          >
            <h3 className="text-base font-semibold text-gray-900">{t('report_title')}</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('report_reason')}</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as Reason)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {REASONS.map((r) => (
                  <option key={r} value={r}>{t(`report_reason_${r}`)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('report_details')}</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={loading}
                className="px-3 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {loading ? '…' : t('report_submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
