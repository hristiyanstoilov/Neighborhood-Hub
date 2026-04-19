'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { queryKeys } from '@/lib/query-keys'

export type ReservationRole = 'borrower' | 'owner'

export interface ReservationRow {
  id: string
  toolId: string
  toolTitle: string | null
  toolImageUrl: string | null
  borrowerId: string
  ownerId: string
  startDate: string
  endDate: string
  status: string
  notes: string | null
  cancellationReason: string | null
}

async function fetchReservations(viewerId: string, role: ReservationRole): Promise<ReservationRow[]> {
  const res = await apiFetch(`/api/tool-reservations?role=${role}`)
  if (!res.ok) throw new Error('RESERVATIONS_FETCH_FAILED')
  const json = await res.json()
  return json.data ?? []
}

export function useReservations(viewerId: string, role: ReservationRole) {
  return useQuery<ReservationRow[]>({
    queryKey: queryKeys.tools.myReservations(viewerId, role),
    queryFn: () => fetchReservations(viewerId, role),
    staleTime: 10_000,
  })
}

const ACTION_ERROR_MESSAGES: Record<string, string> = {
  RESERVATION_ALREADY_TERMINAL: 'This reservation is already closed.',
  INVALID_TRANSITION: 'This action is not allowed in the current state.',
  FORBIDDEN: 'You do not have permission for this action.',
  TOO_MANY_REQUESTS: 'Too many requests. Please wait a moment.',
}

export function useReservationAction(viewerId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      reservationId,
      action,
      cancellationReason,
    }: {
      reservationId: string
      action: 'approve' | 'reject' | 'return' | 'cancel'
      cancellationReason?: string
    }) => {
      const res = await apiFetch(`/api/tool-reservations/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, cancellationReason }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(ACTION_ERROR_MESSAGES[json.error] ?? 'Something went wrong.')
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tools.myReservations(viewerId, role) })
    },
  })
}
