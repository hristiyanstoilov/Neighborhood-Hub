'use client'

import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import { toIsoStringFromLocalInput } from '@/lib/format'
import { useToast } from '@/components/ui/toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { queryFoodReservations } from '@/lib/queries/food'

type FoodReservation = Awaited<ReturnType<typeof queryFoodReservations>>[number]

const ACTION_STATUS: Record<string, string> = {
  approve:  'reserved',
  reject:   'rejected',
  cancel:   'cancelled',
  picked_up: 'picked_up',
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
  const { showToast } = useToast()
  const t = useTranslations('food')
  const tCommon = useTranslations('common')
  const [pickupAt, setPickupAt] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [myReservation, setMyReservation] = useState(initialReservation)
  const [reservations, setReservations] = useState(initialReservations)
  const [confirm, setConfirm] = useState<{ reservationId: string; action: 'approve' | 'reject' | 'cancel' | 'picked_up'; reason?: string } | null>(null)

  const isOwner = currentUserId === ownerId
  const isOpen = foodShareStatus === 'available'
  const activeReservations = useMemo(
    () => reservations.filter((r) => r.status !== 'cancelled' && r.status !== 'rejected' && r.status !== 'picked_up'),
    [reservations]
  )

  const statusLabels: Record<string, string> = {
    pending:   t('status_pending'),
    reserved:  t('status_reserved'),
    picked_up: t('status_picked_up'),
    rejected:  t('status_rejected'),
    cancelled: tCommon('status.cancelled'),
  }

  const toastLabels: Record<string, string> = {
    approve:   t('toast_approve'),
    reject:    t('toast_reject'),
    cancel:    t('toast_cancel'),
    picked_up: t('toast_picked_up'),
  }

  const confirmConfig: Record<string, { title: string; description?: string; confirmLabel: string; confirmVariant?: 'danger' | 'primary' }> = {
    approve:   { title: t('confirm_approve_title'), confirmLabel: t('confirm_approve_label'), confirmVariant: 'primary' },
    reject:    { title: t('confirm_reject_title'), description: t('confirm_reject_desc'), confirmLabel: t('confirm_reject_label') },
    cancel:    { title: t('confirm_cancel_title'), confirmLabel: t('confirm_cancel_label') },
    picked_up: { title: t('confirm_picked_up_title'), description: t('confirm_picked_up_desc'), confirmLabel: t('confirm_picked_up_label'), confirmVariant: 'primary' },
  }

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
      showToast({ title: t('toast_reserve_success'), variant: 'success' })
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
        FOOD_NOT_AVAILABLE:           t('errors.food_not_available'),
        CANNOT_RESERVE_OWN_FOOD:      t('errors.cannot_reserve_own'),
        VALIDATION_ERROR:             t('errors.validation_reservation'),
        UNVERIFIED_EMAIL:             t('errors.unverified_email'),
        DUPLICATE_ACTIVE_RESERVATION: t('errors.duplicate_reservation'),
      }
      setError(messages[code] ?? t('errors.unexpected'))
    }
  }

  function promptAction(reservationId: string, action: 'approve' | 'reject' | 'cancel' | 'picked_up', reason?: string) {
    setConfirm({ reservationId, action, reason })
  }

  async function runAction(reservationId: string, action: 'approve' | 'reject' | 'cancel' | 'picked_up', cancellationReason?: string) {
    setConfirm(null)
    setBusyId(reservationId)
    setError('')
    try {
      const res = await apiFetch(`/api/food-shares/${foodShareId}/reservations/${reservationId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, cancellationReason }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(json?.error ?? 'UNKNOWN_ERROR')
      showToast({ title: toastLabels[action] ?? t('done'), variant: 'success' })
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
        INVALID_TRANSITION:           t('errors.invalid_transition'),
        FORBIDDEN:                    t('errors.forbidden'),
        DUPLICATE_ACTIVE_RESERVATION: t('errors.duplicate_reservation'),
      }
      setError(messages[code] ?? t('errors.unexpected'))
    } finally {
      setBusyId(null)
    }
  }

  const confirmCfg = confirm ? confirmConfig[confirm.action] : null

  if (!currentUserId) {
    return (
      <div className="mt-6 border-t border-gray-100 pt-6">
        <p className="text-sm text-gray-500 mb-3">{t('login_to_reserve_text')}</p>
        <Link href={`/login?next=/food/${foodShareId}`} className="inline-flex bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-800 transition-colors">{t('login_to_reserve_btn')}</Link>
      </div>
    )
  }

  const dialog = confirm && confirmCfg ? (
    <ConfirmDialog
      open
      title={confirmCfg.title}
      description={confirmCfg.description}
      confirmLabel={confirmCfg.confirmLabel}
      confirmVariant={confirmCfg.confirmVariant}
      busy={busyId === confirm.reservationId}
      onConfirm={() => void runAction(confirm.reservationId, confirm.action, confirm.reason)}
      onCancel={() => setConfirm(null)}
    />
  ) : null

  if (isOwner) {
    return (
      <>
        <div className="mt-6 border-t border-gray-100 pt-6">
          <h2 className="text-lg font-semibold mb-4">{t('reservation_requests_title')}</h2>
          {activeReservations.length === 0 ? (
            <p className="text-sm text-gray-500">{t('no_active_reservations')}</p>
          ) : (
            <div className="space-y-3">
              {activeReservations.map((reservation) => (
                <div key={reservation.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{reservation.requesterName ?? t('anonymous')}</p>
                      <p className="text-xs text-gray-500">{t('pickup_prefix', { date: new Date(reservation.pickupAt).toLocaleString('en-GB') })}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">{statusLabels[reservation.status] ?? reservation.status}</span>
                  </div>
                  {reservation.notes && <p className="text-sm text-gray-600 mb-3">{reservation.notes}</p>}
                  <div className="flex flex-wrap gap-2">
                    {reservation.status === 'pending' && (
                      <>
                        <button disabled={busyId === reservation.id} onClick={() => promptAction(reservation.id, 'approve')} className="px-3 py-1.5 text-sm rounded-md bg-green-700 text-white hover:bg-green-800 disabled:opacity-50">{t('approve_btn')}</button>
                        <button disabled={busyId === reservation.id} onClick={() => promptAction(reservation.id, 'reject')} className="px-3 py-1.5 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50">{t('reject_btn')}</button>
                      </>
                    )}
                    {reservation.status === 'reserved' && (
                      <button disabled={busyId === reservation.id} onClick={() => promptAction(reservation.id, 'picked_up')} className="px-3 py-1.5 text-sm rounded-md bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50">{t('picked_up_btn')}</button>
                    )}
                    <button disabled={busyId === reservation.id} onClick={() => promptAction(reservation.id, 'cancel', 'Cancelled by owner')} className="px-3 py-1.5 text-sm rounded-md border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50">{t('cancel_btn')}</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </div>
        {dialog}
      </>
    )
  }

  return (
    <>
      <div className="mt-6 border-t border-gray-100 pt-6">
        {myReservation?.status === 'pending' || myReservation?.status === 'reserved' ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-800 mb-1">{t('your_reservation')}</p>
            <p className="text-sm text-green-700 mb-1">{t('pickup_prefix', { date: new Date(myReservation.pickupAt).toLocaleString('en-GB') })}</p>
            {myReservation.notes && <p className="text-sm text-green-700 mb-3">{myReservation.notes}</p>}
            <button onClick={() => promptAction(myReservation.id, 'cancel', 'Cancelled by requester')} disabled={busyId === myReservation.id} className="px-3 py-1.5 text-sm rounded-md border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50">{t('cancel_reservation_btn')}</button>
          </div>
        ) : isOpen ? (
          <form onSubmit={submitReservation} className="space-y-4">
            <h2 className="text-lg font-semibold">{t('reserve_title')}</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('pickup_time_label')}</label>
              <input type="datetime-local" value={pickupAt} onChange={(e) => setPickupAt(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('notes_label')}</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm min-h-24 resize-none" maxLength={500} placeholder={t('notes_placeholder')} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="w-full bg-green-700 text-white py-2.5 rounded-md font-medium hover:bg-green-800 transition-colors">{t('reserve_btn')}</button>
          </form>
        ) : (
          <p className="text-sm text-gray-500">{t('food_unavailable')}</p>
        )}
      </div>
      {dialog}
    </>
  )
}
