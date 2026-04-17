import Link from 'next/link'
import { queryEventsPage } from '@/lib/queries/events'
import { cookies } from 'next/headers'
import { queryUserByRefreshToken } from '@/lib/queries/admin'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  published: 'Upcoming',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const { status, page: rawPage } = await searchParams
  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)

  let events: Awaited<ReturnType<typeof queryEventsPage>>['events'] = []
  let total = 0
  let isLoggedIn = false

  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refresh_token')?.value
    const [eventsResult, user] = await Promise.all([
      queryEventsPage({ status: status ?? 'published', limit: 20, page }),
      refreshToken ? queryUserByRefreshToken(refreshToken) : Promise.resolve(null),
    ])
    events = eventsResult.events
    total = eventsResult.total
    isLoggedIn = !!user
  } catch {
    // show empty state
  }

  const totalPages = Math.max(1, Math.ceil(total / 20))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Community Events</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} event{total !== 1 ? 's' : ''} found
          </p>
        </div>
        {isLoggedIn && (
          <Link
            href="/events/new"
            className="bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors"
          >
            + Create event
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['published', 'completed', 'cancelled'].map((s) => (
          <Link
            key={s}
            href={`/events?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              (status ?? 'published') === s
                ? 'bg-green-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-lg mb-1">No events yet.</p>
          {isLoggedIn ? (
            <Link href="/events/new" className="text-sm text-green-700 hover:underline">
              Be the first to create one →
            </Link>
          ) : (
            <Link href="/login?next=/events/new" className="text-sm text-green-700 hover:underline">
              Log in to create one →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-5 hover:border-green-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="font-semibold text-gray-900 leading-snug line-clamp-2">{event.title}</h2>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                  event.status === 'published'
                    ? 'bg-green-100 text-green-700'
                    : event.status === 'cancelled'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {STATUS_LABELS[event.status] ?? event.status}
                </span>
              </div>

              <p className="text-sm text-green-700 font-medium mb-1">
                {formatDate(event.startsAt)}
              </p>

              {(event.locationNeighborhood || event.address) && (
                <p className="text-xs text-gray-500 mb-2">
                  {event.locationNeighborhood
                    ? `${event.locationNeighborhood}, ${event.locationCity}`
                    : event.address}
                </p>
              )}

              {event.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{event.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>by {event.organizerName ?? 'Anonymous'}</span>
                {event.maxCapacity && (
                  <span>Max {event.maxCapacity} attendees</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <Link
              href={`/events?status=${status ?? 'published'}&page=${page - 1}`}
              className="px-4 py-2 text-sm rounded-md border border-gray-200 hover:bg-gray-50"
            >
              ← Previous
            </Link>
          )}
          <span className="px-4 py-2 text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/events?status=${status ?? 'published'}&page=${page + 1}`}
              className="px-4 py-2 text-sm rounded-md border border-gray-200 hover:bg-gray-50"
            >
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
