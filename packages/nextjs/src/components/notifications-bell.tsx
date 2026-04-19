'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/auth'
import { queryKeys } from '@/lib/query-keys'

interface NotificationRow {
  id: string
  type: string
  entityType: string
  entityId: string | null
  isRead: boolean
  createdAt: string
}

const POLL_INTERVAL_MS = 30_000

export default function NotificationsBell() {
  const { user, loading } = useAuth()

  const { data: items = [] } = useQuery<NotificationRow[]>({
    queryKey: queryKeys.notifications.unread(user?.id ?? 'anonymous'),
    enabled: !loading && !!user,
    refetchInterval: POLL_INTERVAL_MS,
    retry: 2,
    // Throw on failure so TanStack Query retries automatically.
    // The `data = []` default means the bell shows 0 on error — no nav crash.
    queryFn: async () => {
      const res = await apiFetch('/api/notifications')
      if (!res.ok) throw new Error('NOTIFICATIONS_FETCH_FAILED')
      const json = await res.json()
      return json.data ?? []
    },
  })

  const unreadCount = items.filter((item) => !item.isRead).length

  return (
    <Link
      href="/notifications"
      className="relative p-1.5 rounded-md text-gray-600 hover:text-green-700 hover:bg-gray-100 transition-colors"
      aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
    >
      <span className="sr-only">Notifications</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>

      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
