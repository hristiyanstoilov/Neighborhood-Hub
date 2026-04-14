'use client'

import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

export interface EditProfileLocation {
  id: string
  city: string
  neighborhood: string
}

export const editProfileKeys = {
  all: ['profile-edit'] as const,
  locations: () => [...editProfileKeys.all, 'locations'] as const,
}

function readErrorCode(json: unknown): string {
  if (json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string') {
    return (json as { error: string }).error
  }

  return 'UNKNOWN_ERROR'
}

async function fetchEditProfileLocations(): Promise<EditProfileLocation[]> {
  const res = await apiFetch('/api/locations')
  const json = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(readErrorCode(json))
  }

  return Array.isArray(json?.data) ? json.data : []
}

export function useEditProfileData(enabled: boolean) {
  return useQuery<EditProfileLocation[]>({
    queryKey: editProfileKeys.locations(),
    queryFn: fetchEditProfileLocations,
    enabled,
    staleTime: 60_000,
  })
}