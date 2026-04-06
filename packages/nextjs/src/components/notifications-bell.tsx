'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

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
  const [items, setItems] = useState<NotificationRow[]>([])
  const [open, setOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiFetch('/api/notifications')
      if (!res.ok) return
      const json = await res.json()
      setItems(json.data ?? [])
    } catch {
      // Silent — bell must never crash the nav
    }
  }, [])

  // Initial fetch on mount
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Poll every 30 seconds
  useEffect(() => {
    const timer = setInterval(fetchNotifications, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [fetchNotifications])

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

  async function markAllRead() {
    setItems([]) // optimistic
    await apiFetch('/api/notifications/read', { method: 'PATCH' }).catch(() => {})
  }

  async function handleNotificationClick(item: NotificationRow) {
    setActionLoading(true)
    // Optimistic remove
    setItems((prev) => prev.filter((n) => n.id !== item.id))
    setOpen(false)
    await apiFetch('/api/notifications/read', {
      method: 'PATCH',
      body: JSON.stringify({ id: item.id }),
    }).catch(() => {})
    setActionLoading(false)
    if (item.entityType === 'skill_request') {
      router.push('/my-requests')
    }
  }

  const unreadCount = items.length

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
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
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-800">Notifications</span>
            {unreadCount > 0 && (
              <button
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
                    onClick={() => handleNotificationClick(item)}
                    disabled={actionLoading}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    <p className="text-sm font-medium text-gray-800 leading-snug">
                      {TYPE_LABELS[item.type] ?? 'New notification'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(item.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
