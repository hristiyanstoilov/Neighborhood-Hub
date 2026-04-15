'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED:      'You must be logged in.',
  FORBIDDEN:         'You do not have permission to delete this skill.',
  NOT_FOUND:         'Skill not found.',
  TOO_MANY_REQUESTS: 'Too many attempts. Please wait and try again.',
}

export function useDeleteSkill(skillId: string) {
  const router = useRouter()
  const { showToast } = useToast()

  return useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/skills/${skillId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(ERROR_MESSAGES[json.error] ?? 'Could not delete skill. Please try again.')
      }
      return json.data
    },
    onSuccess: () => {
      showToast({
        variant: 'success',
        title: 'Skill deleted',
        message: 'The skill listing was removed successfully.',
      })
      router.push('/skills')
    },
  })
}
