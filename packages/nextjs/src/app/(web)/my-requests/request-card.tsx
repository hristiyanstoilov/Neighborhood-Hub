'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { SkillRequestRow } from '@/lib/queries/skill-requests'
import { useToast } from '@/components/ui/toast'
import { RatingForm } from '@/components/ui/rating-form'
import { apiFetch } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'
import { type RequestsRole, useRequestActions } from './_hooks'
import {
  RequestCardHeader,
  RequestCardDetails,
  RequestActions,
  CancelReasonForm,
} from './_components'

interface Props {
  request: SkillRequestRow
  viewerId: string
  role: RequestsRole
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export default function RequestCard({ request, viewerId, role }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [cancelPrompt, setCancelPrompt] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const { showToast } = useToast()

  const isOwner = request.userToId === viewerId
  const isRequester = request.userFromId === viewerId
  const otherName = isOwner ? request.requesterName : request.ownerName
  const ratedUserId = isOwner ? request.userFromId : request.userToId
  const ratedUserName = otherName ?? 'neighbor'
  const TERMINAL = ['rejected', 'completed', 'cancelled']

  const ratingCheckQuery = useQuery({
    queryKey: queryKeys.ratings.check(viewerId, 'skill_request', request.id),
    queryFn: async () => {
      const params = new URLSearchParams({
        contextType: 'skill_request',
        contextId: request.id,
      })
      const res = await apiFetch(`/api/ratings/check?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? 'CHECK_FAILED')
      return json.data as { hasRated: boolean; existingRating: { score: number } | null }
    },
    enabled: request.status === 'completed',
    staleTime: 10_000,
  })

  const updateMutation = useRequestActions({
    requestId: request.id,
    viewerId,
    role,
    cancelReason,
    onSuccessStatus: (nextStatus) => {
      setCancelPrompt(false)
      setCancelReason('')
      showToast({
        variant: 'success',
        title: 'Request updated',
        message: `The request is now ${nextStatus}.`,
      })
    },
    onErrorMessage: (message) => {
      setError(message)
    },
  })

  async function handleAction(action: 'accept' | 'reject' | 'complete' | 'cancel') {
    setError(null)
    await updateMutation.mutateAsync(action)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <RequestCardHeader
        skillId={request.skillId}
        skillTitle={request.skillTitle}
        isOwner={isOwner}
        otherName={otherName}
        status={request.status}
        statusClassName={STATUS_STYLES[request.status] ?? STATUS_STYLES.cancelled}
      />

      <RequestCardDetails request={request} />

      {error && (
        <p role="alert" aria-live="assertive" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">
          {error}
        </p>
      )}

      <RequestActions
        status={request.status}
        isOwner={isOwner}
        isRequester={isRequester}
        terminalStatuses={TERMINAL}
        loading={updateMutation.isPending}
        onAction={handleAction}
        onOpenCancelPrompt={() => setCancelPrompt(true)}
      />

      {cancelPrompt && (
        <CancelReasonForm
          value={cancelReason}
          loading={updateMutation.isPending}
          onChange={setCancelReason}
          onConfirm={() => handleAction('cancel')}
          onBack={() => {
            setCancelPrompt(false)
            setCancelReason('')
          }}
        />
      )}

      {request.status === 'completed' && !ratingCheckQuery.isLoading && (
        ratingCheckQuery.data?.hasRated ? (
          <p className="text-xs mt-3 text-amber-700 font-medium">
            You rated {ratedUserName} {ratingCheckQuery.data.existingRating?.score ?? '—'} ★
          </p>
        ) : (
          <RatingForm
            viewerId={viewerId}
            contextType="skill_request"
            contextId={request.id}
            ratedUserId={ratedUserId}
            ratedUserName={ratedUserName}
          />
        )
      )}
    </div>
  )
}
