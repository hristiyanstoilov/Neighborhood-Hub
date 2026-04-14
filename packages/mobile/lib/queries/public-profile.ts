import { apiFetch } from '../api'

export interface PublicSkill {
  id: string
  title: string
  imageUrl: string | null
  categoryLabel: string | null
}

export interface PublicProfile {
  id: string
  name: string | null
  bio: string | null
  avatarUrl: string | null
  location: string | null
  memberSince: string
  skills: PublicSkill[]
}

export type PublicProfileErrorCode = 'PROFILE_NOT_FOUND' | 'PROFILE_PRIVATE' | 'FETCH_FAILED'

export const publicProfileKeys = {
  all: ['public-profile'] as const,
  detail: (id: string) => [...publicProfileKeys.all, 'detail', id] as const,
}

export async function fetchPublicProfileById(id: string): Promise<PublicProfile> {
  const res = await apiFetch(`/api/users/${id}`)
  const json = await res.json().catch(() => null)

  if (res.status === 404) {
    throw new Error('PROFILE_NOT_FOUND')
  }

  if (res.status === 403) {
    throw new Error('PROFILE_PRIVATE')
  }

  if (!res.ok || !json || typeof json !== 'object' || !('data' in json)) {
    throw new Error('FETCH_FAILED')
  }

  return json.data as PublicProfile
}

export function asPublicProfileErrorCode(message: string): PublicProfileErrorCode {
  if (message === 'PROFILE_NOT_FOUND') return 'PROFILE_NOT_FOUND'
  if (message === 'PROFILE_PRIVATE') return 'PROFILE_PRIVATE'
  return 'FETCH_FAILED'
}