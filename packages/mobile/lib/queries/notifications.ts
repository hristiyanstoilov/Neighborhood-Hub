import { apiFetch } from '../api'

export interface NotificationItem {
  id: string
  type: string
  entityType: string
  entityId: string | null
  isRead: boolean
  createdAt: string
}

export const notificationsKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationsKeys.all, 'list'] as const,
}

function readErrorCode(json: unknown): string {
  if (json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string') {
    return (json as { error: string }).error
  }

  return 'UNKNOWN_ERROR'
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await apiFetch('/api/notifications')
  const json = await res.json()

  if (!res.ok) {
    throw new Error(readErrorCode(json))
  }

  return Array.isArray(json.data) ? json.data : []
}

export async function markNotificationRead(id?: string): Promise<void> {
  const res = await apiFetch('/api/notifications/read', {
    method: 'PATCH',
    body: id ? JSON.stringify({ id }) : undefined,
  })
  const json = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(readErrorCode(json))
  }
}