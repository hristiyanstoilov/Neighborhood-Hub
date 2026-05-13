'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  accessToken: string
  unreadCount: number
}

export default function MarkAllReadButton({ accessToken, unreadCount }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)
  const [optimisticUnread, setOptimisticUnread] = useState(unreadCount)

  async function markAllRead() {
    if (busy || optimisticUnread === 0) return

    setBusy(true)
    setError(false)
    setOptimisticUnread(0)

    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      })

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
        {busy ? 'Marking…' : 'Mark all as read'}
      </button>
      {error && <p className="text-xs text-red-600">Failed to mark as read</p>}
    </div>
  )
}
