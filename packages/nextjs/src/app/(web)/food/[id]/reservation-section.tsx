'use client'

import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { toIsoStringFromLocalInput } from '@/lib/format'
import type { queryFoodReservations } from '@/lib/queries/food'

type FoodReservation = Awaited<ReturnType<typeof queryFoodReservations>>[number]

const ACTION_STATUS: Record<string, string> = {
  approve: 'reserved',
  reject: 'rejected',
  cancel: 'cancelled',
  picked_up: 'picked_up',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  reserved: 'Reserved',
  picked_up: 'Picked up',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
}

type Props = {
  foodShareId: string
  foodShareStatus: string
  ownerId: string
  currentUserId: string | null
  initialReservation: { id: string; status: string; pickupAt: Date; notes: string | null; cancellationReason: string | null } | null
  reservations: FoodReservation[]
}

export default function ReservationSection({
  foodShareId,
  foodShareStatus,
  ownerId,
  currentUserId,
  initialReservation,
  reservations: initialReservations,
}: Props) {
  const router = useRouter()
  const [pickupAt, setPickupAt] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [myReservation, setMyReservation] = useState(initialReservation)
  const [reservations, setReservations] = useState(initialReservations)

  const isOwner = currentUserId === ownerId
  const isOpen = foodShareStatus === 'available'
  const activeReservations = useMemo(
    () => reservations.filter((reservation) => reservation.status !== 'cancelled' && reservation.status !== 'rejected'),
    [reservations]
  )

  async function submitReservation(e: FormEvent) {
    e.preventDefault()
    if (!currentUserId) return
    setError('')
    try {
      const res = await apiFetch(`/api/food-shares/${foodShareId}/reservations`, {
        method: 'POST',
        body: JSON.stringify({ pickupAt: toIsoStringFromLocalInput(pickupAt), notes: notes || undefined }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error ?? 'UNKNOWN_ERROR')
      setMyReservation({
        id: json.data.id,
        status: json.data.status,
        pickupAt: new Date(json.data.pickupAt),
        notes: json.data.notes ?? null,
        cancellationReason: json.data.cancellationReason ?? null,
      })
      router.refresh()
    } catch (err) {
      const code = err instanceof Error ? err.message : 'UNKNOWN_ERROR'
      const messages: Record<string, string> = {
        FOOD_NOT_AVAILABLE: 'This listing is no longer available.',
        CANNOT_RESERVE_OWN_FOOD: 'You cannot reserve your own food listing.',
        VALIDATION_ERROR: 'Please select a pickup time in the future.',
        UNVERIFIED_EMAIL: 'Please verify your email before reserving food.',
        DUPLICATE_ACTIVE_RESERVATION: 'You already have an active reservation for this listing.',
      }
      setError(messages[code] ?? 'Something went wrong.')
    }
  }

  async function runAction(reservationId: string, action: 'approve' | 'reject' | 'cancel' | 'picked_up', cancellationReason?: string) {
    setBusyId(reservationId)
    setError('')
    try {
      const res = await apiFetch(`/api/food-shares/${foodShareId}/reservations/${reservationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, cancellationReason }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error ?? 'UNKNOWN_ERROR')
      // Optimistic update — don't wait for router.refresh() to reflect the new status
      const newStatus = ACTION_STATUS[action]
      if (newStatus) {
        setReservations((prev) => prev.map((r) => r.id === reservationId ? { ...r, status: newStatus } : r))
      }
      if (currentUserId && json.data.requesterId === currentUserId) {
        setMyReservation({
          id: json.data.id,
          status: json.data.status,
          pickupAt: new Date(json.data.pickupAt),
          notes: json.data.notes ?? null,
          cancellationReason: json.data.cancellationReason ?? null,
        })
      }
      router.refresh()
    } catch (err) {
      const code = err instanceof Error ? err.message : 'UNKNOWN_ERROR'
      const messages: Record<string, string> = {
        INVALID_TRANSITION: 'This reservation cannot change to that state.',
        FORBIDDEN: 'You are not allowed to do that.',
        DUPLICATE_ACTIVE_RESERVATION: 'You already have an active reservation for this listing.',
      }
      setError(messages[code] ?? 'Something went wrong.')
    } finally {
      setBusyId(null)
    }
  }

  if (!currentUserId) {
    return (
      <div className="mt-6 border-t border-gray-100 pt-6">
        <p className="text-sm text-gray-500 mb-3">Log in to reserve this food listing.</p>
        <Link href={`/login?next=/food/${foodShareId}`} className="inline-flex bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors">Log in to reserve</Link>
      </div>
    )
  }

  if (isOwner) {
    return (
      <div className="mt-6 border-t border-gray-100 pt-6">
        <h2 className="text-lg font-semibold mb-4">Reservation requests</h2>
        {activeReservations.length === 0 ? (
          <p className="text-sm text-gray-500">No active reservations yet.</p>
        ) : (
          <div className="space-y-3">
            {activeReservations.map((reservation) => (
              <div key={reservation.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{reservation.requesterName ?? 'Anonymous'}</p>
                    <p className="text-xs text-gray-500">Pickup: {new Date(reservation.pickupAt).toLocaleString('en-GB')}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">{STATUS_LABELS[reservation.status] ?? reservation.status}</span>
                </div>
                {reservation.notes && <p className="text-sm text-gray-600 mb-3">{reservation.notes}</p>}
                <div className="flex flex-wrap gap-2">
                  {reservation.status === 'pending' && (
                    <>
                      <button disabled={busyId === reservation.id} onClick={() => void runAction(reservation.id, 'approve')} className="px-3 py-1.5 text-sm rounded-md bg-green-700 text-white hover:bg-green-800 disabled:opacity-50">Approve</button>
                      <button disabled={busyId === reservation.id} onClick={() => void runAction(reservation.id, 'reject')} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">Reject</button>
                    </>
                  )}
                  {reservation.status === 'reserved' && (
                    <button disabled={busyId === reservation.id} onClick={() => void runAction(reservation.id, 'picked_up')} className="px-3 py-1.5 text-sm rounded-md bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50">Mark picked up</button>
                  )}
                  <button disabled={busyId === reservation.id} onClick={() => void runAction(reservation.id, 'cancel', 'Cancelled by owner')} className="px-3 py-1.5 text-sm rounded-md border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50">Cancel</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>
    )
  }

  return (
    <div className="mt-6 border-t border-gray-100 pt-6">
      {myReservation?.status === 'pending' || myReservation?.status === 'reserved' ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-800 mb-1">Your reservation</p>
          <p className="text-sm text-green-700 mb-1">Pickup: {new Date(myReservation.pickupAt).toLocaleString('en-GB')}</p>
          {myReservation.notes && <p className="text-sm text-green-700 mb-3">{myReservation.notes}</p>}
          <button onClick={() => void runAction(myReservation.id, 'cancel', 'Cancelled by requester')} disabled={busyId === myReservation.id} className="px-3 py-1.5 text-sm rounded-md border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50">Cancel reservation</button>
        </div>
      ) : isOpen ? (
        <form onSubmit={submitReservation} className="space-y-4">
          <h2 className="text-lg font-semibold">Reserve this food</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup time</label>
            <input type="datetime-local" value={pickupAt} onChange={(e) => setPickupAt(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm min-h-24 resize-none" maxLength={500} placeholder="Allergies, timing, how you'll pick it up…" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="w-full bg-green-700 text-white py-2.5 rounded-md font-medium hover:bg-green-800 transition-colors">Reserve food</button>
        </form>
      ) : (
        <p className="text-sm text-gray-500">This food listing is no longer available for new reservations.</p>
      )}
    </div>
  )
}