'use client'

import { useState } from 'react'
import type { SkillRequestRow } from '@/lib/queries/skill-requests'
import { useToast } from '@/components/ui/toast'
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
  const [status, setStatus] = useState(request.status)
  const [error, setError] = useState<string | null>(null)
  const [cancelPrompt, setCancelPrompt] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const { showToast } = useToast()

  const isOwner = request.userToId === viewerId
  const isRequester = request.userFromId === viewerId
  const otherName = isOwner ? request.requesterName : request.ownerName
  const TERMINAL = ['rejected', 'completed', 'cancelled']

  const updateMutation = useRequestActions({
    requestId: request.id,
    viewerId,
    role,
    cancelReason,
    onSuccessStatus: (nextStatus) => {
      setStatus(nextStatus)
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
        status={status}
        statusClassName={STATUS_STYLES[status] ?? STATUS_STYLES.cancelled}
      />

      <RequestCardDetails request={request} />

      {error && (
        <p role="alert" aria-live="assertive" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">
          {error}
        </p>
      )}

      <RequestActions
        status={status}
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
    </div>
  )
}
