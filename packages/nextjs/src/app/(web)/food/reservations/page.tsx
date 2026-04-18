import Link from 'next/link'
import { cookies } from 'next/headers'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { queryFoodReservationsForUser } from '@/lib/queries/food'

export const dynamic = 'force-dynamic'

const ROLE_LABELS: Record<string, string> = {
  requester: 'My reservations',
  owner: 'Reservations for my food',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  reserved: 'Reserved',
  picked_up: 'Picked up',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

export default async function FoodReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const { role: rawRole } = await searchParams
  const role = rawRole === 'owner' ? 'owner' : 'requester'

  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')?.value
  const user = refreshToken ? await queryUserByRefreshToken(refreshToken) : null

  if (!user) {
    return (
      <div className="max-w-2xl text-center py-24">
        <p className="text-lg text-gray-500 mb-2">Log in to view your food reservations.</p>
        <Link href="/login?next=/food/reservations" className="text-sm text-green-700 hover:underline">Log in →</Link>
      </div>
    )
  }

  const reservations = await queryFoodReservationsForUser(user.id, role)

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Food Reservations</h1>
          <p className="text-sm text-gray-500 mt-0.5">{ROLE_LABELS[role]}</p>
        </div>
        <Link href="/food" className="text-sm text-green-700 hover:underline">Browse food</Link>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(['requester', 'owner'] as const).map((itemRole) => (
          <Link
            key={itemRole}
            href={`/food/reservations?role=${itemRole}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              role === itemRole
                ? 'border-green-700 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {itemRole === 'requester' ? 'My reservations' : 'Food to review'}
          </Link>
        ))}
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="mb-2">
            {role === 'requester' ? "You haven't reserved any food yet." : 'No one has reserved your food yet.'}
          </p>
          <Link href="/food" className="text-sm text-green-700 hover:underline">Browse food listings →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => (
            <div key={reservation.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <Link href={`/food/${reservation.foodShareId}`} className="font-semibold text-gray-900 hover:text-green-700 hover:underline">
                    {reservation.foodShareTitle}
                  </Link>
                  <p className="text-xs text-gray-500">Pickup: {new Date(reservation.pickupAt).toLocaleString('en-GB')}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                  {STATUS_LABELS[reservation.status] ?? reservation.status}
                </span>
              </div>
              {reservation.notes && <p className="text-sm text-gray-600 mb-1">{reservation.notes}</p>}
              {reservation.cancellationReason && <p className="text-sm text-red-600">Cancelled: {reservation.cancellationReason}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}