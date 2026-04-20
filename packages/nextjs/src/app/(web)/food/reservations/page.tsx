import Link from 'next/link'
import { cookies } from 'next/headers'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { queryFoodReservationsForUser } from '@/lib/queries/food'
import { FoodReservationsClient } from './food-reservations-client'

export const dynamic = 'force-dynamic'

const ROLE_LABELS: Record<string, string> = {
  requester: 'My reservations',
  owner: 'Reservations for my food',
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
        <FoodReservationsClient reservations={reservations} viewerId={user.id} />
      )}
    </div>
  )
}