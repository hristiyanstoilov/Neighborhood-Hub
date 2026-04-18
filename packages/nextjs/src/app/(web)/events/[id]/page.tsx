import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { queryEventById, queryUserRsvp } from '@/lib/queries/events'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import RsvpButton from './rsvp-button'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const event = await queryEventById(id)
    if (!event) return {}
    return {
      title: event.title,
      description: event.description ?? `Join this community event on Neighborhood Hub.`,
    }
  } catch { return {} }
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let event = null
  let fetchError = false
  let currentUserId: string | null = null
  let rsvpStatus: 'attending' | 'cancelled' | null = null

  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refresh_token')?.value
    const [eventResult, user] = await Promise.all([
      queryEventById(id),
      refreshToken ? queryUserByRefreshToken(refreshToken) : Promise.resolve(null),
    ])
    event = eventResult
    currentUserId = user?.id ?? null

    if (event && currentUserId) {
      const rsvp = await queryUserRsvp(event.id, currentUserId)
      rsvpStatus = (rsvp?.status as 'attending' | 'cancelled' | null) ?? null
    }
  } catch {
    fetchError = true
  }

  if (!fetchError && !event) notFound()

  if (fetchError) {
    return (
      <div className="max-w-2xl">
        <Link href="/events" className="text-sm text-gray-500 hover:text-green-700 mb-6 inline-block">
          ← Back to Events
        </Link>
        <div className="text-center py-24 text-gray-500">
          <p className="text-lg mb-2">Could not load this event.</p>
          <p className="text-sm">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  const isOrganizer = currentUserId === event!.organizerId

  return (
    <div className="max-w-2xl">
      <Link href="/events" className="text-sm text-gray-500 hover:text-green-700 mb-6 inline-block">
        ← Back to Events
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {event!.imageUrl && (
          <Image
            src={event!.imageUrl}
            alt={event!.title}
            width={1200}
            height={500}
            unoptimized
            className="w-full max-h-64 object-cover"
          />
        )}
        <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold leading-snug">{event!.title}</h1>
          <span className={`shrink-0 text-sm px-3 py-1 rounded-full font-medium ${
            event!.status === 'published'
              ? 'bg-green-100 text-green-700'
              : event!.status === 'cancelled'
              ? 'bg-red-100 text-red-600'
              : 'bg-gray-100 text-gray-500'
          }`}>
            {event!.status === 'published' ? 'Upcoming' : event!.status}
          </span>
        </div>

        {event!.description && (
          <p className="text-gray-600 mb-6 leading-relaxed">{event!.description}</p>
        )}

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Starts</dt>
            <dd className="font-medium">{formatDate(event!.startsAt)}</dd>
          </div>
          {event!.endsAt && (
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Ends</dt>
              <dd className="font-medium">{formatDate(event!.endsAt)}</dd>
            </div>
          )}
          {(event!.locationNeighborhood || event!.address) && (
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Location</dt>
              <dd className="font-medium">
                {event!.locationNeighborhood
                  ? `${event!.locationNeighborhood}, ${event!.locationCity}`
                  : event!.address}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Organised by</dt>
            <dd className="font-medium">
              <Link href={`/users/${event!.organizerId}`} className="hover:text-green-700 hover:underline">
                {event!.organizerName ?? 'Anonymous'}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Attendees</dt>
            <dd className="font-medium">
              {event!.attendeeCount}
              {event!.maxCapacity ? ` / ${event!.maxCapacity}` : ''}
            </dd>
          </div>
        </dl>

        {isOrganizer && event!.status === 'published' && (
          <p className="text-xs text-gray-400 text-center mb-4">
            You are the organiser — manage this event from your profile.
          </p>
        )}

        <RsvpButton
          eventId={event!.id}
          organizerId={event!.organizerId}
          status={event!.status}
          initialRsvpStatus={rsvpStatus}
        />
        </div>
      </div>
    </div>
  )
}
