'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { RatingForm } from '@/components/ui/rating-form'
import { apiFetch } from '@/lib/api'
import { formatDateTime } from '@/lib/format'
import { queryKeys } from '@/lib/query-keys'

type ReservationItem = {
  id: string
  foodShareId: string
  foodShareTitle: string | null
  requesterId: string
  ownerId: string
  pickupAt: string | Date
  status: string
  notes: string | null
  cancellationReason: string | null
}

type Props = {
  reservations: ReservationItem[]
  viewerId: string
}

function FoodReservationRating({ reservation, viewerId }: { reservation: ReservationItem; viewerId: string }) {
  const t = useTranslations('food')
  const isRequester = reservation.requesterId === viewerId
  const ratedUserId = isRequester ? reservation.ownerId : reservation.requesterId
  const ratedUserName = isRequester ? t('food_owner_name') : t('requester_name')

  const ratingCheckQuery = useQuery({
    queryKey: queryKeys.ratings.check(viewerId, 'food_reservation', reservation.id),
    queryFn: async () => {
      const params = new URLSearchParams({
        contextType: 'food_reservation',
        contextId: reservation.id,
      })
      const res = await apiFetch(`/api/ratings/check?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? 'CHECK_FAILED')
      return json.data as { hasRated: boolean; existingRating: { score: number } | null }
    },
    enabled: reservation.status === 'picked_up',
    staleTime: 10_000,
  })

  if (reservation.status !== 'picked_up' || ratingCheckQuery.isLoading) {
    return null
  }

  if (ratingCheckQuery.data?.hasRated) {
    return (
      <p className="text-xs mt-3 text-amber-700 font-medium">
        {t('you_rated', { name: ratedUserName, score: ratingCheckQuery.data.existingRating?.score ?? '—' })}
      </p>
    )
  }

  return (
    <RatingForm
      viewerId={viewerId}
      contextType="food_reservation"
      contextId={reservation.id}
      ratedUserId={ratedUserId}
      ratedUserName={ratedUserName}
    />
  )
}

export function FoodReservationsClient({ reservations, viewerId }: Props) {
  const t = useTranslations('food')
  const tCommon = useTranslations('common')

  const statusLabels: Record<string, string> = {
    pending:   t('status_pending'),
    reserved:  t('status_reserved'),
    picked_up: t('status_picked_up'),
    rejected:  t('status_rejected'),
    cancelled: tCommon('status.cancelled'),
  }

  return (
    <div className="space-y-4">
      {reservations.map((reservation) => (
        <div key={reservation.id} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <Link href={`/food/${reservation.foodShareId}`} className="font-semibold text-gray-900 hover:text-green-700 hover:underline">
                {reservation.foodShareTitle}
              </Link>
              <p className="text-xs text-gray-500">{t('pickup_prefix', { date: formatDateTime(reservation.pickupAt) })}</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
              {statusLabels[reservation.status] ?? reservation.status}
            </span>
          </div>
          {reservation.notes && <p className="text-sm text-gray-600 mb-1">{reservation.notes}</p>}
          {reservation.cancellationReason && <p className="text-sm text-red-600">{t('cancelled_prefix', { reason: reservation.cancellationReason })}</p>}

          <FoodReservationRating reservation={reservation} viewerId={viewerId} />
        </div>
      ))}
    </div>
  )
}
