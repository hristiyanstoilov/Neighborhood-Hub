'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { requestActionErrorMessage, skillRequestsQueryKey } from './requests-contract'
import { type RequestsRole } from './use-skill-requests'

type RequestAction = 'accept' | 'reject' | 'complete' | 'cancel'

type UseRequestActionsParams = {
  requestId: string
  viewerId: string
  role: RequestsRole
  cancelReason: string
  onSuccessStatus: (status: string) => void
  onErrorMessage: (message: string) => void
}

export function useRequestActions({
  requestId,
  viewerId,
  role,
  cancelReason,
  onSuccessStatus,
  onErrorMessage,
}: UseRequestActionsParams) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (action: RequestAction) => {
      const body: Record<string, string> = { action }
      if (action === 'cancel') body.cancellationReason = cancelReason

      const res = await apiFetch(`/api/skill-requests/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })

      const json = await res.json().catch(() => null)
      return { res, json }
    },
    onSuccess: async ({ res, json }) => {
      if (!res.ok) {
        onErrorMessage(requestActionErrorMessage(json?.error))
        return
      }

      onSuccessStatus(json.data.status)
      await queryClient.invalidateQueries({ queryKey: skillRequestsQueryKey(viewerId, role) })
    },
    onError: () => {
      onErrorMessage('Network error. Please check your connection and try again.')
    },
  })
}
