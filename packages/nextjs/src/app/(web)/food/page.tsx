import Link from 'next/link'
import { cookies } from 'next/headers'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import { queryFoodSharesPage } from '@/lib/queries/food'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Food Sharing',
  description: 'Share surplus food with neighbors and reduce waste in your community.',
}

const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  reserved: 'Reserved',
  picked_up: 'Picked up',
}

function getStatusLabel(foodShare: { status: string; remainingQuantity?: number | null }) {
  if (foodShare.status === 'available' && typeof foodShare.remainingQuantity === 'number') {
    return foodShare.remainingQuantity === 1
      ? 'Available (1 left)'
      : `Available (${foodShare.remainingQuantity} left)`
  }
  return STATUS_LABELS[foodShare.status] ?? foodShare.status
}

function formatDate(d: Date | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function FoodPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>
}) {
  const { status, page: rawPage } = await searchParams
  const page = Math.max(1, parseInt(rawPage ?? '1', 10) || 1)

  let foodShares: Awaited<ReturnType<typeof queryFoodSharesPage>>['foodShares'] = []
  let total = 0
  let isLoggedIn = false

  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refresh_token')?.value
    const [foodResult, user] = await Promise.all([
      queryFoodSharesPage({ status: status ?? 'available', limit: 20, page }),
      refreshToken ? queryUserByRefreshToken(refreshToken) : Promise.resolve(null),
    ])
    foodShares = foodResult.foodShares
    total = foodResult.total
    isLoggedIn = !!user
  } catch {
    // show empty state
  }

  const totalPages = Math.max(1, Math.ceil(total / 20))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Food Sharing</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} listing{total !== 1 ? 's' : ''} found
          </p>
        </div>
        {isLoggedIn && (
          <Link
            href="/food/new"
            className="bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors"
          >
            + Share food
          </Link>
        )}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['available', 'reserved', 'picked_up'].map((s) => (
          <Link
            key={s}
            href={`/food?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              (status ?? 'available') === s
                ? 'bg-green-700 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {foodShares.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-lg mb-1">No food listings yet.</p>
          {isLoggedIn ? (
            <Link href="/food/new" className="text-sm text-green-700 hover:underline">
              Be the first to share food →
            </Link>
          ) : (
            <Link href="/login?next=/food/new" className="text-sm text-green-700 hover:underline">
              Log in to share food →
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {foodShares.map((foodShare) => (
            <Link
              key={foodShare.id}
              href={`/food/${foodShare.id}`}
              className="block bg-white rounded-lg border border-gray-200 p-5 hover:border-green-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="font-semibold text-gray-900 leading-snug line-clamp-2">{foodShare.title}</h2>
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                  foodShare.status === 'available'
                    ? 'bg-green-100 text-green-700'
                    : foodShare.status === 'reserved'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {getStatusLabel(foodShare)}
                </span>
              </div>

              {foodShare.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{foodShare.description}</p>
              )}

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                <span>Quantity: {foodShare.quantity}</span>
                <span>Left: {foodShare.remainingQuantity ?? foodShare.quantity}</span>
                <span>Owner: {foodShare.ownerName ?? 'Anonymous'}</span>
                <span className="col-span-2">
                  Location: {foodShare.locationNeighborhood ? `${foodShare.locationNeighborhood}, ${foodShare.locationCity}` : '—'}
                </span>
                {foodShare.availableUntil && (
                  <span className="col-span-2">Available until: {formatDate(foodShare.availableUntil)}</span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{foodShare.pickupInstructions ? 'Pickup instructions included' : 'Pickup details available on request'}</span>
                <span>Listed {new Date(foodShare.createdAt).toLocaleDateString('en-GB')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {page > 1 && (
            <Link
              href={`/food?status=${status ?? 'available'}&page=${page - 1}`}
              className="px-4 py-2 text-sm rounded-md border border-gray-200 hover:bg-gray-50"
            >
              ← Previous
            </Link>
          )}
          <span className="px-4 py-2 text-sm text-gray-500">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <Link
              href={`/food?status=${status ?? 'available'}&page=${page + 1}`}
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