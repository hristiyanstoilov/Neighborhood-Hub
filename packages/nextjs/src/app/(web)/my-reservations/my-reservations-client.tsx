'use client'

import Link from 'next/link'
import ReservationCard from './reservation-card'
import { useReservations, type ReservationRole } from './use-reservations'

function RoleTabs({ role }: { role: ReservationRole }) {
  return (
    <div className="flex gap-1 mb-6 border-b border-gray-200">
      {(['borrower', 'owner'] as ReservationRole[]).map((r) => (
        <Link
          key={r}
          href={`/my-reservations?role=${r}`}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            role === r
              ? 'border-green-700 text-green-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {r === 'borrower' ? 'Borrowing' : 'My tools'}
        </Link>
      ))}
    </div>
  )
}

export function MyReservationsClient({
  role,
  viewerId,
}: {
  role: ReservationRole
  viewerId: string
}) {
  const query = useReservations(viewerId, role)
  const reservations = query.data ?? []

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">My Reservations</h1>

      <RoleTabs role={role} />

      {query.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg h-32 animate-pulse" />
          ))}
        </div>
      ) : query.isError ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-2">Could not load reservations.</p>
          <button
            onClick={() => query.refetch()}
            className="text-sm text-green-700 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="mb-2">
            {role === 'borrower'
              ? "You haven't reserved any tools yet."
              : "No one has reserved your tools yet."}
          </p>
          {role === 'borrower' && (
            <Link href="/tools" className="text-sm text-green-700 hover:underline">
              Browse available tools →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((r) => (
            <ReservationCard key={r.id} reservation={r} viewerId={viewerId} role={role} />
          ))}
        </div>
      )}
    </div>
  )
}
