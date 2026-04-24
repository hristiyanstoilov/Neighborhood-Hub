import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { signAccessToken } from '@/lib/auth'
import { formatDateTime } from '@/lib/format'
import MarkAllReadButton from './mark-all-read-button'
import { AppIcon, type AppIconName } from '@/components/ui/app-icon'

export const dynamic = 'force-dynamic'

type NotificationRow = {
  id: string
  type: string
  entityType: string
  entityId: string | null
  isRead: boolean
  createdAt: string
}

const TYPE_LABELS: Record<string, string> = {
  new_request: 'New skill request received',
  request_accepted: 'Your request was accepted',
  request_rejected: 'Your request was rejected',
  request_cancelled: 'A request was cancelled',
  request_completed: 'A session was marked complete',
  reservation_new: 'New tool reservation request',
  reservation_approved: 'Your tool reservation was approved',
  reservation_rejected: 'Your tool reservation was rejected',
  reservation_cancelled: 'A tool reservation was cancelled',
  reservation_returned: 'Tool marked as returned',
  food_reservation_new: 'New food reservation request',
  food_reservation_approved: 'Your food reservation was approved',
  food_reservation_rejected: 'Your food reservation was rejected',
  food_reservation_cancelled: 'A food reservation was cancelled',
  food_reservation_picked_up: 'Food was marked as picked up',
  event_new_rsvp: 'New RSVP for your event',
  event_cancelled: 'An event was cancelled',
  drive_new_pledge: 'New pledge for your drive',
  drive_pledge_fulfilled: 'A pledge was fulfilled',
  drive_completed: 'A drive was completed',
}

const TYPE_ICONS: Record<string, AppIconName> = {
  new_request: 'requests',
  request_accepted: 'check',
  request_rejected: 'close',
  request_cancelled: 'cancel',
  request_completed: 'complete',
  reservation_new: 'tools',
  reservation_approved: 'check',
  reservation_rejected: 'close',
  reservation_cancelled: 'cancel',
  reservation_returned: 'return',
  food_reservation_new: 'food',
  food_reservation_approved: 'check',
  food_reservation_rejected: 'close',
  food_reservation_cancelled: 'cancel',
  food_reservation_picked_up: 'food',
  event_new_rsvp: 'events',
  event_cancelled: 'cancel',
  drive_new_pledge: 'pledge',
  drive_pledge_fulfilled: 'target',
  drive_completed: 'check',
}

function getBaseUrl(headerStore: Headers) {
  const host = headerStore.get('x-forwarded-host') ?? headerStore.get('host') ?? 'localhost:3000'
  const proto = headerStore.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

function notificationHref(item: NotificationRow) {
  if (item.entityType === 'skill_request') return '/my-requests'
  if (item.entityType === 'food_reservation') return '/food/reservations'
  if (item.entityType === 'tool_reservation') return '/my-reservations'
  if (item.entityType === 'drive_pledge' && item.entityId) return `/drives/${item.entityId}`
  if (item.entityType === 'event_rsvp' && item.entityId) return `/events/${item.entityId}`
  return '/'
}

async function fetchNotifications(baseUrl: string, accessToken: string): Promise<NotificationRow[]> {
  const res = await fetch(`${baseUrl}/api/notifications`, {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    return []
  }

  const json = await res.json().catch(() => null)
  return Array.isArray(json?.data) ? json.data : []
}

function NotificationList({ title, items }: { title: string; items: NotificationRow[] }) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{title}</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={notificationHref(item)}
              className={`block rounded-lg border p-4 transition-colors ${
                item.isRead ? 'bg-white border-gray-200 hover:bg-gray-50' : 'bg-green-50 border-green-200 hover:bg-green-100'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="rounded-full bg-white/80 p-1.5 text-gray-600" aria-hidden="true">
                  <AppIcon name={TYPE_ICONS[item.type] ?? 'bell'} size={16} />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{TYPE_LABELS[item.type] ?? 'New notification'}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatDateTime(item.createdAt)}</p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default async function NotificationsPage() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value

  if (!refreshToken) {
    redirect('/login?next=/notifications')
  }

  const user = await queryUserByRefreshToken(refreshToken)
  if (!user) {
    redirect('/login?next=/notifications')
  }

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  })

  const headerStore = await headers()
  const baseUrl = getBaseUrl(headerStore)
  const notifications = await fetchNotifications(baseUrl, accessToken)

  const unread = notifications.filter((item) => !item.isRead)
  const read = notifications.filter((item) => item.isRead)

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unread.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
              {unread.length}
            </span>
          )}
        </div>
        <MarkAllReadButton accessToken={accessToken} unreadCount={unread.length} />
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
          No notifications yet.
        </div>
      ) : (
        <div className="space-y-6">
          <NotificationList title="Unread" items={unread} />
          <NotificationList title="Read" items={read} />
        </div>
      )}
    </div>
  )
}
