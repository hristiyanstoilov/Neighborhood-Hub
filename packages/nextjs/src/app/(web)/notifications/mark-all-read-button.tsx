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
  const [optimisticUnread, setOptimisticUnread] = useState(unreadCount)

  async function markAllRead() {
    if (busy || optimisticUnread === 0) return

    setBusy(true)
    setOptimisticUnread(0)

    try {
      const res = await fetch('/api/notifications/read', {
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
    } finally {
      setBusy(false)
    }
  }

  if (optimisticUnread === 0) return null

  return (
    <button
      type="button"
      onClick={() => void markAllRead()}
      disabled={busy}
      className="text-sm font-medium text-green-700 hover:text-green-800 disabled:opacity-50"
    >
      {busy ? 'Marking…' : 'Mark all as read'}
    </button>
  )
}
