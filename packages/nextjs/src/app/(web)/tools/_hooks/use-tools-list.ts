'use client'

import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { Tool } from '../_components/types'
import { toolListQueryKey, type ToolListFilters } from './tools-contract'

export type ToolsPage = {
  tools: Tool[]
  total: number
}

async function fetchTools(filters: ToolListFilters): Promise<ToolsPage> {
  const params = new URLSearchParams()
  params.set('page', String(filters.page))
  params.set('limit', '20')
  if (filters.status) params.set('status', filters.status)
  if (filters.search) params.set('search', filters.search)
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  if (filters.locationId) params.set('locationId', filters.locationId)

  const res = await apiFetch(`/api/tools?${params.toString()}`)
  if (!res.ok) throw new Error('TOOLS_FETCH_FAILED')

  const json = await res.json()
  return {
    tools: json.data ?? [],
    total: typeof json.total === 'number' ? json.total : (json.data?.length ?? 0),
  }
}

export function useToolsList(
  filters: ToolListFilters,
  initialData?: ToolsPage,
) {
  return useQuery<ToolsPage>({
    queryKey: toolListQueryKey(filters),
    queryFn: () => fetchTools(filters),
    staleTime: 15_000,
    initialData,
  })
}
