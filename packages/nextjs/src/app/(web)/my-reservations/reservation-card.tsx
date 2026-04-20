'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { useToast } from '@/components/ui/toast'
import { RatingForm } from '@/components/ui/rating-form'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { apiFetch } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { formatDate as sharedFormatDate } from '@/lib/format'
import { type ReservationRow, useReservationAction } from './use-reservations'

interface Props {
  reservation: ReservationRow
  viewerId: string
}

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  approved:  'bg-green-100 text-green-700',
  rejected:  'bg-red-100 text-red-700',
  returned:  'bg-blue-100 text-blue-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const TERMINAL = ['rejected', 'returned', 'cancelled']

const ACTION_LABEL: Record<string, string> = {
  approve: 'approved',
  reject:  'rejected',
  return:  'returned',
  cancel:  'cancelled',
}

const STATUS_LABEL: Record<string, string> = {
  pending:   'Pending',
  approved:  'Approved',
  rejected:  'Rejected',
  returned:  'Returned',
  cancelled: 'Cancelled',
}


export default function ReservationCard({ reservation, viewerId }: Props) {
  const [error, setError]               = useState<string | null>(null)
  const [cancelPrompt, setCancelPrompt] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'return' | null>(null)
  const { showToast } = useToast()

  const isBorrower = reservation.borrowerId === viewerId
  const isOwner    = reservation.ownerId    === viewerId
  const isTerminal = TERMINAL.includes(reservation.status)
  const ratedUserId = isBorrower ? reservation.ownerId : reservation.borrowerId
  const ratedUserName = isBorrower ? 'tool owner' : 'borrower'

  const ratingCheckQuery = useQuery({
    queryKey: queryKeys.ratings.check(viewerId, 'tool_reservation', reservation.id),
    queryFn: async () => {
      const params = new URLSearchParams({
        contextType: 'tool_reservation',
        contextId: reservation.id,
      })
      const res = await apiFetch(`/api/ratings/check?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? 'CHECK_FAILED')
      return json.data as { hasRated: boolean; existingRating: { score: number } | null }
    },
    enabled: reservation.status === 'returned',
    staleTime: 10_000,
  })

  const action = useReservationAction(viewerId)

  async function handleAction(act: 'approve' | 'reject' | 'return' | 'cancel', reason?: string) {
    setError(null)
    try {
      await action.mutateAsync({ reservationId: reservation.id, action: act, cancellationReason: reason })
      setCancelPrompt(false)
      setCancelReason('')
      showToast({ variant: 'success', title: 'Reservation updated', message: `Status: ${ACTION_LABEL[act] ?? act}.` })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <Link
            href={`/tools/${reservation.toolId}`}
            className="font-semibold text-gray-900 hover:text-green-700 hover:underline"
          >
            {reservation.toolTitle ?? 'Unknown tool'}
          </Link>
          <p className="text-xs text-gray-400 mt-0.5">
            {isBorrower ? 'You are borrowing' : 'Requested by borrower'}
          </p>
        </div>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[reservation.status] ?? STATUS_STYLES.cancelled}`}>
          {STATUS_LABEL[reservation.status] ?? reservation.status}
        </span>
      </div>

      {/* Details */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
        <div>
          <dt className="text-xs text-gray-400">From</dt>
          <dd className="font-medium">{sharedFormatDate(reservation.startDate)}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-400">Until</dt>
          <dd className="font-medium">{sharedFormatDate(reservation.endDate)}</dd>
        </div>
      </dl>

      {reservation.notes && (
        <p className="text-sm text-gray-500 mb-3 italic">"{reservation.notes}"</p>
      )}

      {reservation.cancellationReason && (
        <p className="text-sm text-gray-400 mb-3">
          <span className="font-medium text-gray-500">Reason:</span> {reservation.cancellationReason}
        </p>
      )}

      {error && (
        <p role="alert" aria-live="assertive" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">
          {error}
        </p>
      )}

      {/* Actions */}
      {!isTerminal && !cancelPrompt && (
        <div className="flex flex-wrap gap-2">
          {/* Owner: approve/reject pending */}
          {isOwner && reservation.status === 'pending' && (
            <>
              <button
                onClick={() => setConfirmAction('approve')}
                disabled={action.isPending}
                className="px-3 py-1.5 bg-green-700 text-white rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => setConfirmAction('reject')}
                disabled={action.isPending}
                className="px-3 py-1.5 border border-red-300 text-red-600 rounded-md text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                Reject
              </button>
            </>
          )}

          {/* Borrower: return approved */}
          {isBorrower && reservation.status === 'approved' && (
            <button
              onClick={() => setConfirmAction('return')}
              disabled={action.isPending}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Mark returned
            </button>
          )}

          {/* Cancel: borrower can cancel pending/approved; owner can cancel approved */}
          {((isBorrower && ['pending', 'approved'].includes(reservation.status)) ||
            (isOwner && reservation.status === 'approved')) && (
            <button
              onClick={() => setCancelPrompt(true)}
              className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Cancel reason form */}
      {cancelPrompt && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Reason for cancellation (optional)
          </label>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => handleAction('cancel', cancelReason || undefined)}
              disabled={action.isPending}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {action.isPending ? '…' : 'Confirm cancel'}
            </button>
            <button
              onClick={() => { setCancelPrompt(false); setCancelReason('') }}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmAction !== null}
        title={
          confirmAction === 'approve' ? 'Approve this reservation?' :
          confirmAction === 'reject'  ? 'Decline this reservation?' :
          'Mark as returned?'
        }
        description={
          confirmAction === 'reject' ? 'The slot will reopen for other borrowers.' :
          confirmAction === 'return' ? 'This confirms the tool has been returned.' :
          undefined
        }
        confirmLabel={
          confirmAction === 'approve' ? 'Approve' :
          confirmAction === 'reject'  ? 'Decline' :
          'Mark returned'
        }
        confirmVariant={confirmAction === 'reject' ? 'danger' : 'primary'}
        onConfirm={() => { handleAction(confirmAction!); setConfirmAction(null) }}
        onCancel={() => setConfirmAction(null)}
        busy={action.isPending}
      />

      {reservation.status === 'returned' && !ratingCheckQuery.isLoading && (
        ratingCheckQuery.data?.hasRated ? (
          <p className="text-xs mt-3 text-amber-700 font-medium">
            You rated {ratedUserName} {ratingCheckQuery.data.existingRating?.score ?? '—'} ★
          </p>
        ) : (
          <RatingForm
            viewerId={viewerId}
            contextType="tool_reservation"
            contextId={reservation.id}
            ratedUserId={ratedUserId}
            ratedUserName={ratedUserName}
          />
        )
      )}
    </div>
  )
}
