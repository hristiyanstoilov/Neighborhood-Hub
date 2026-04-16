'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import { useToast } from '@/components/ui/toast'

export function useDeleteTool(toolId: string) {
  const router = useRouter()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/tools/${toolId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to delete tool.')
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      showToast({ variant: 'success', title: 'Tool deleted', message: 'Your tool listing has been removed.' })
      router.push('/tools')
    },
  })
}
