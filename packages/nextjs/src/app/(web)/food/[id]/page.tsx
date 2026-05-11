import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { getTranslations } from 'next-intl/server'
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
      openGraph: {
        title: foodShare.title,
        description: foodShare.description ?? 'Share surplus food with neighbors on Neighborhood Hub.',
        type: 'website',
        images: foodShare.imageUrl ? [{ url: foodShare.imageUrl }] : [],
      },
    }
  } catch {
    return {}
  }
}

function formatDate(value: Date | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default async function FoodDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const t = await getTranslations('food')

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
        <Link href="/food" className="text-sm text-gray-500 hover:text-green-700 mb-6 inline-block">{t('back')}</Link>
        <div className="text-center py-24 text-gray-500">
          <p className="text-lg mb-2">{t('detail_error_title')}</p>
          <p className="text-sm">{t('detail_error_message')}</p>
        </div>
      </div>
    )
  }

  const statusLabels: Record<string, string> = {
    available: t('status_available'),
    reserved:  t('status_reserved'),
    picked_up: t('status_picked_up'),
  }

  function getStatusLabel(fs: { status: string; remainingQuantity?: number | null }) {
    if (fs.status === 'available' && typeof fs.remainingQuantity === 'number') {
      return t('status_available_left', { count: fs.remainingQuantity })
    }
    return statusLabels[fs.status] ?? fs.status
  }

  return (
    <div className="max-w-2xl">
      <Link href="/food" className="text-sm text-gray-500 hover:text-green-700 mb-6 inline-block">{t('back')}</Link>

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
              <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">{t('field_quantity')}</dt>
              <dd className="font-medium">{foodShare!.quantity}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">{t('field_organised_by')}</dt>
              <dd className="font-medium flex items-center gap-2 flex-wrap">
                <Link href={`/users/${foodShare!.ownerId}`} className="hover:text-green-700 hover:underline">
                  {foodShare!.ownerName ?? t('anonymous')}
                </Link>
                {(foodShare!.ownerRatingCount ?? 0) > 0 && (
                  <span className="text-xs text-amber-600 font-normal whitespace-nowrap">
                    {'★'.repeat(Math.round(parseFloat(foodShare!.ownerAvgRating ?? '0')))}
                    {' '}{parseFloat(foodShare!.ownerAvgRating ?? '0').toFixed(1)}
                    {' '}({foodShare!.ownerRatingCount})
                  </span>
                )}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">{t('field_location')}</dt>
              <dd className="font-medium">
                {foodShare!.locationNeighborhood ? `${foodShare!.locationNeighborhood}, ${foodShare!.locationCity}` : '—'}
              </dd>
            </div>
            {foodShare!.availableUntil && (
              <div>
                <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">{t('field_available_until')}</dt>
                <dd className="font-medium">{formatDate(foodShare!.availableUntil)}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">{t('field_reservations')}</dt>
              <dd className="font-medium">{foodShare!.reservationCount}</dd>
            </div>
            <div>
              <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">{t('field_left')}</dt>
              <dd className="font-medium">{foodShare!.remainingQuantity ?? foodShare!.quantity}</dd>
            </div>
            {foodShare!.pickupInstructions && (
              <div className="col-span-2">
                <dt className="text-gray-400 text-xs uppercase tracking-wide mb-0.5">{t('field_pickup_instructions')}</dt>
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
