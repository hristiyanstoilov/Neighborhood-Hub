import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
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
  if (item.entityType === 'food_reservation') return '/food'
  if (item.entityType === 'tool_reservation') return '/my-reservations'
  if (item.entityType === 'drive_pledge' && item.entityId) return `/drives/${item.entityId}`
  if (item.entityType === 'event_rsvp' && item.entityId) return `/events/${item.entityId}`
  return '/'
}

async function fetchNotifications(baseUrl: string, accessToken: string): Promise<NotificationRow[]> {
  const res = await fetch(`${baseUrl}/api/notifications`, {
    headers: { authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })

  if (!res.ok) return []
  const json = await res.json().catch(() => null)
  return Array.isArray(json?.data) ? json.data : []
}

function NotificationList({
  title,
  items,
  typeLabels,
  fallbackLabel,
}: {
  title: string
  items: NotificationRow[]
  typeLabels: Record<string, string>
  fallbackLabel: string
}) {
  if (items.length === 0) return null

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
                  <p className="text-sm font-medium text-gray-900">{typeLabels[item.type] ?? fallbackLabel}</p>
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
  const t = await getTranslations('notifications')

  const typeLabels: Record<string, string> = {
    new_request: t('types.new_request'),
    request_accepted: t('types.request_accepted'),
    request_rejected: t('types.request_rejected'),
    request_cancelled: t('types.request_cancelled'),
    request_completed: t('types.request_completed'),
    reservation_new: t('types.reservation_new'),
    reservation_approved: t('types.reservation_approved'),
    reservation_rejected: t('types.reservation_rejected'),
    reservation_cancelled: t('types.reservation_cancelled'),
    reservation_returned: t('types.reservation_returned'),
    food_reservation_new: t('types.food_reservation_new'),
    food_reservation_approved: t('types.food_reservation_approved'),
    food_reservation_rejected: t('types.food_reservation_rejected'),
    food_reservation_cancelled: t('types.food_reservation_cancelled'),
    food_reservation_picked_up: t('types.food_reservation_picked_up'),
    event_new_rsvp: t('types.event_new_rsvp'),
    event_cancelled: t('types.event_cancelled'),
    drive_new_pledge: t('types.drive_new_pledge'),
    drive_pledge_fulfilled: t('types.drive_pledge_fulfilled'),
    drive_completed: t('types.drive_completed'),
  }

  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value

  if (!refreshToken) redirect('/login?next=/notifications')

  const user = await queryUserByRefreshToken(refreshToken)
  if (!user) redirect('/login?next=/notifications')

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role })

  const headerStore = await headers()
  const baseUrl = getBaseUrl(headerStore)
  const notifications = await fetchNotifications(baseUrl, accessToken)

  const unread = notifications.filter((item) => !item.isRead)
  const read = notifications.filter((item) => item.isRead)

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
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
          {t('empty')}
        </div>
      ) : (
        <div className="space-y-6">
          <NotificationList title={t('unread')} items={unread} typeLabels={typeLabels} fallbackLabel={t('new_notification')} />
          <NotificationList title={t('read_label')} items={read} typeLabels={typeLabels} fallbackLabel={t('new_notification')} />
        </div>
      )}
    </div>
  )
}
