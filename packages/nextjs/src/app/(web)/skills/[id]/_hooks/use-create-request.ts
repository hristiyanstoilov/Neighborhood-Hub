'use client'

import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export interface CreateRequestBody {
  skillId: string
  scheduledStart: string
  scheduledEnd: string
  meetingType: 'in_person' | 'online' | 'hybrid'
  meetingUrl?: string
  notes?: string
}

const ERROR_MESSAGES: Record<string, string> = {
  UNVERIFIED_EMAIL:       'Please verify your email before requesting a skill.',
  SKILL_NOT_AVAILABLE:    'This skill is no longer available.',
  REQUEST_ALREADY_EXISTS: 'You already have a pending or accepted request for this skill.',
  TOO_MANY_REQUESTS:      'Too many requests. Please wait and try again.',
  VALIDATION_ERROR:       'Please check the form and try again.',
}

export function useCreateRequest() {
  return useMutation({
    mutationFn: async (body: CreateRequestBody) => {
      const res = await apiFetch('/api/skill-requests', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(ERROR_MESSAGES[json.error] ?? 'Something went wrong. Please try again.')
      }
      return json.data
    },
  })
}
