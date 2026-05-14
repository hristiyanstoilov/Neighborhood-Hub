'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'

type Props = {
  unreadCount: number
}

export default function MarkAllReadButton({ unreadCount }: Props) {
  const router = useRouter()
  const t = useTranslations('notifications')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [optimisticUnread, setOptimisticUnread] = useState(unreadCount)

  async function markAllRead() {
    if (busy || optimisticUnread === 0) return

    setBusy(true)
    setError(false)
    setOptimisticUnread(0)

    try {
      const res = await apiFetch('/api/notifications/read-all', { method: 'POST' })

      if (!res.ok) {
        throw new Error('MARK_ALL_FAILED')
      }

      router.refresh()
    } catch {
      setOptimisticUnread(unreadCount)
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  if (optimisticUnread === 0) return null

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void markAllRead()}
        disabled={busy}
        className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        {busy ? t('marking') : t('mark_all_read')}
      </button>
      {error && <p className="text-xs text-red-600">{t('mark_all_read_error')}</p>}
    </div>
  )
}
