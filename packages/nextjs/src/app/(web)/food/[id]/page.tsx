import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { queryFoodShareById, queryFoodReservations, queryUserFoodReservation } from '@/lib/queries/food'
import { queryUserByRefreshToken } from '@/lib/queries/admin'
import ReservationSection from './reservation-section'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const foodShare = await queryFoodShareById(id)
    if (!foodShare) return {}
    return {
      title: foodShare.title,
      description: foodShare.description ?? 'Share surplus food with neighbors on Neighborhood Hub.',
    }
  } catch {
    return {}
  }
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

function formatDate(value: Date | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function FoodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let foodShare = null
  let fetchError = false
  let currentUserId: string | null = null
  let userReservation: { id: string; status: string; pickupAt: Date; notes: string | null; cancellationReason: string | null } | null = null
  let reservations: Awaited<ReturnType<typeof queryFoodReservations>> = []

  try {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refresh_token')?.value
    const [foodResult, user] = await Promise.all([
      queryFoodShareById(id),
      refreshToken ? queryUserByRefreshToken(refreshToken) : Promise.resolve(null),
    ])
    foodShare = foodResult
    currentUserId = user?.id ?? null

    if (foodShare && currentUserId) {
      const isOwner = foodShare.ownerId === currentUserId
      const [reservationsResult, myReservation] = await Promise.all([
        isOwner ? queryFoodReservations(foodShare.id) : Promise.resolve([]),
        queryUserFoodReservation(foodShare.id, currentUserId),
      ])
      reservations = reservationsResult
      userReservation = myReservation
    }
  } catch {
    fetchError = true
  }

  if (!fetchError && !foodShare) notFound()

  if (fetchError) {
    return (
      <div className="max-w-2xl">
        <Link href="/food" className="text-sm text-gray-500 hover:text-green-700 mb-6 inline-block">← Back to Food Sharing</Link>
        <div className="text-center py-24 text-gray-500">
          <p className="text-lg mb-2">Could not load this food listing.</p>
          <p className="text-sm">Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  const isOwner = currentUserId === foodShare!.ownerId

  return (
    <div className="max-w-2xl">
      <Link href="/food" className="text-sm text-gray-500 hover:text-green-700 mb-6 inline-block">← Back to Food Sharing</Link>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {foodShare!.imageUrl && (
          <Image src={foodShare!.imageUrl} alt={foodShare!.title} width={1200} height={520} unoptimized className="w-full max-h-64 object-cover" />
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold leading-snug">{foodShare!.title}</h1>
            <span className={`shrink-0 text-sm px-3 py-1 rounded-full font-medium ${
              foodShare!.status === 'available'
                ? 'bg-green-100 text-green-700'
                : foodShare!.status === 'reserved'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {getStatusLabel(foodShare!)}
            </span>
          </div>

          {foodShare!.description && <p className="text-gray-600 mb-6 leading-relaxed">{foodShare!.description}</p>}

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm mb-6">
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Quantity</dt>
              <dd className="font-medium">{foodShare!.quantity}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Organised by</dt>
              <dd className="font-medium">
                <Link href={`/users/${foodShare!.ownerId}`} className="hover:text-green-700 hover:underline">
                  {foodShare!.ownerName ?? 'Anonymous'}
                </Link>
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Location</dt>
              <dd className="font-medium">
                {foodShare!.locationNeighborhood ? `${foodShare!.locationNeighborhood}, ${foodShare!.locationCity}` : '—'}
              </dd>
            </div>
            {foodShare!.availableUntil && (
              <div>
                <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Available until</dt>
                <dd className="font-medium">{formatDate(foodShare!.availableUntil)}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Reservations</dt>
              <dd className="font-medium">{foodShare!.reservationCount}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Left</dt>
              <dd className="font-medium">{foodShare!.remainingQuantity ?? foodShare!.quantity}</dd>
            </div>
            {foodShare!.pickupInstructions && (
              <div className="col-span-2">
                <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">Pickup instructions</dt>
                <dd className="font-medium">{foodShare!.pickupInstructions}</dd>
              </div>
            )}
          </dl>

          <ReservationSection
            foodShareId={foodShare!.id}
            foodShareStatus={foodShare!.status}
            ownerId={foodShare!.ownerId}
            currentUserId={currentUserId}
            initialReservation={userReservation}
            reservations={reservations}
          />
        </div>
      </div>
    </div>
  )
}