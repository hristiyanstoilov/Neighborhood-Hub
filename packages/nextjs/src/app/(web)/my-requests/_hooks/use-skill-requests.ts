'use client'

import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { SkillRequestRow } from '@/lib/queries/skill-requests'
import { skillRequestsQueryKey } from './requests-contract'
import { QUERY_DEFAULTS } from '@/lib/query-defaults'

export type RequestsRole = 'requester' | 'owner'

async function fetchSkillRequests(role: RequestsRole): Promise<SkillRequestRow[]> {
  const res = await apiFetch(`/api/skill-requests?role=${role}&page=1&limit=50`)

  if (!res.ok) {
    throw new Error('REQUESTS_FETCH_FAILED')
  }

  const json = await res.json()
  return json.data ?? []
}

export function useSkillRequests(viewerId: string, role: RequestsRole) {
  return useQuery<SkillRequestRow[]>({
    queryKey: skillRequestsQueryKey(viewerId, role),
    queryFn: () => fetchSkillRequests(role),
    staleTime: QUERY_DEFAULTS.shortStaleTimeMs,
  })
}
