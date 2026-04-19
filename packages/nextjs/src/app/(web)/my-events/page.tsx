import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { queryUserRsvps } from '@/lib/queries/events'
import { formatEventStatus, eventStatusClass, rsvpStatusClass, humanizeValue } from '@/lib/format'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'My Events — Neighborhood Hub' }

export default async function MyEventsPage() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  if (!refreshToken) redirect('/login?next=/my-events')

  const user = await queryUserByRefreshToken(refreshToken)
  if (!user) redirect('/login?next=/my-events')

  const rsvps = await queryUserRsvps(user.id)

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
        <Link href="/events" className="text-sm text-green-700 hover:underline">Browse events →</Link>
      </div>

      {rsvps.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
          <p className="text-gray-500 mb-3">You have not RSVPed to any events yet.</p>
          <Link href="/events" className="inline-block bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors">
            Find events nearby
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {rsvps.map((rsvp) => (
            <Link
              key={rsvp.rsvpId}
              href={`/events/${rsvp.eventId}`}
              className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-green-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-1">
                <p className="font-semibold text-gray-900 line-clamp-1">{rsvp.eventTitle}</p>
                <div className="flex gap-1.5 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rsvpStatusClass(rsvp.rsvpStatus)}`}>
                    {humanizeValue(rsvp.rsvpStatus)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${eventStatusClass(rsvp.eventStatus)}`}>
                    {formatEventStatus(rsvp.eventStatus)}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {new Date(rsvp.eventStartsAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                {rsvp.locationNeighborhood ? ` · ${rsvp.locationNeighborhood}` : ''}
                {rsvp.eventAddress ? ` · ${rsvp.eventAddress}` : ''}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
