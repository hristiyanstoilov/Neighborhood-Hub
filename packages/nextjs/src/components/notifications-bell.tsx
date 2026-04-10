'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/contexts/auth'
import { formatDateTime } from '@/lib/format'

interface NotificationRow {
  id: string
  type: string
  entityType: string
  entityId: string | null
  isRead: boolean
  createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
  new_request:       'New skill request received',
  request_accepted:  'Your request was accepted',
  request_rejected:  'Your request was rejected',
  request_cancelled: 'A request was cancelled',
  request_completed: 'A session was marked complete',
}

const POLL_INTERVAL_MS = 30_000
export default function NotificationsBell() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuId = 'notifications-menu'
  const queryClient = useQueryClient()

  const notificationsQueryKey = ['notifications', 'unread', user?.id ?? 'anonymous']

  const { data: items = [] } = useQuery<NotificationRow[]>({
    queryKey: notificationsQueryKey,
    enabled: !loading && !!user,
    refetchInterval: POLL_INTERVAL_MS,
    queryFn: async () => {
      try {
        const res = await apiFetch('/api/notifications')
        if (!res.ok) return []
        const json = await res.json()
        return json.data ?? []
      } catch {
        // Silent — bell must never crash the nav
        return []
      }
    },
  })

  const markReadMutation = useMutation({
    mutationFn: async (payload?: { id?: string }) => {
      await apiFetch('/api/notifications/read', {
        method: 'PATCH',
        body: payload?.id ? JSON.stringify({ id: payload.id }) : undefined,
      })
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: notificationsQueryKey })
    },
  })

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    if (open) document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open])

  async function markAllRead() {
    await markReadMutation.mutateAsync()
  }

  async function handleNotificationClick(item: NotificationRow) {
    setOpen(false)
    await markReadMutation.mutateAsync({ id: item.id }).catch(() => {})
    if (item.entityType === 'skill_request') {
      router.push('/my-requests')
    }
  }

  const unreadCount = items.length

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="relative p-1.5 rounded-md text-gray-600 hover:text-green-700 hover:bg-gray-100 transition-colors"
      >
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
      </button>

      {open && (
        <div id={menuId} role="menu" aria-label="Notifications menu" className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-800">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs text-green-700 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {unreadCount === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              No new notifications
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleNotificationClick(item)}
                    disabled={markReadMutation.isPending}
                    role="menuitem"
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <p className="text-sm font-medium text-gray-800 leading-snug">
                      {TYPE_LABELS[item.type] ?? 'New notification'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDateTime(item.createdAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
