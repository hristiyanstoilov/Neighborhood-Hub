'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export interface CreateReservationBody {
  toolId: string
  startDate: string
  endDate: string
  notes?: string
}

const ERROR_MESSAGES: Record<string, string> = {
  TOOL_NOT_FOUND:          'This tool no longer exists.',
  TOOL_NOT_AVAILABLE:      'This tool is not available for reservation.',
  CANNOT_RESERVE_OWN_TOOL: 'You cannot reserve your own tool.',
  DUPLICATE_RESERVATION:   'You already have an active reservation for this tool.',
  UNVERIFIED_EMAIL:        'Please verify your email before making a reservation.',
  VALIDATION_ERROR:        'Invalid dates or missing fields.',
  TOO_MANY_REQUESTS:       'Too many requests. Please wait a moment.',
}

export function useCreateReservation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: CreateReservationBody) => {
      const res = await apiFetch('/api/tool-reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(ERROR_MESSAGES[json.error] ?? 'Something went wrong. Please try again.')
      return json.data
    },
    onSuccess: () => {
      // Invalidate any cached tools list so status reflects new reservation
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      queryClient.invalidateQueries({ queryKey: ['my-reservations'] })
    },
  })
}
