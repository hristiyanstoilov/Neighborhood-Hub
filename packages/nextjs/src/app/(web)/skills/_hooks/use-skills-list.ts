'use client'

import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { Skill } from '../_components/types'
import { skillListQueryKey } from './skills-contract'

export type SkillListFilters = {
  status?: string
  search?: string
  categoryId?: string
  locationId?: string
  page: number
}

export type SkillsPage = {
  skills: Skill[]
  total: number
}

async function fetchSkills(filters: SkillListFilters): Promise<SkillsPage> {
  const params = new URLSearchParams()
  params.set('page', String(filters.page))
  params.set('limit', '20')
  if (filters.status) params.set('status', filters.status)
  if (filters.search) params.set('search', filters.search)
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  if (filters.locationId) params.set('locationId', filters.locationId)

  const res = await apiFetch(`/api/skills?${params.toString()}`)
  if (!res.ok) {
    throw new Error('SKILLS_FETCH_FAILED')
  }

  const json = await res.json()
  return {
    skills: json.data ?? [],
    total: typeof json.total === 'number' ? json.total : (json.data?.length ?? 0),
  }
}

export function useSkillsList(
  filters: SkillListFilters,
  initialData?: SkillsPage,
) {
  return useQuery<SkillsPage>({
    queryKey: skillListQueryKey(filters),
    queryFn: () => fetchSkills(filters),
    staleTime: 15_000,
    initialData,
  })
}