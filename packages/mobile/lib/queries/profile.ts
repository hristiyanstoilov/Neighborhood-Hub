import { apiFetch } from '../api'
import { readQueryErrorCode } from '../query-defaults'

export interface ProfileLocationOption {
  id: string
  city: string
  neighborhood: string
}

export interface OwnProfile {
  name: string | null
  bio: string | null
  avatarUrl: string | null
  locationId: string | null
  locationCity: string | null
  locationNeighborhood: string | null
  email: string
  emailVerifiedAt: string | null
  isPublic: boolean
  notificationsEnabled: boolean
}

export interface UpdateProfileInput {
  name: string
  bio: string
  locationId: string | null
  isPublic: boolean
  notificationsEnabled: boolean
}

export interface PatchProfileInput {
  name?: string
  bio?: string
  avatarUrl?: string | null
  locationId?: string | null
  isPublic?: boolean
  notificationsEnabled?: boolean
}

export const profileKeys = {
  all: ['profile'] as const,
  me: () => [...profileKeys.all, 'me'] as const,
  locations: () => [...profileKeys.all, 'locations'] as const,
}

export async function fetchOwnProfile(): Promise<OwnProfile> {
  const res = await apiFetch('/api/profile')
  const json = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(readQueryErrorCode(json))
  }

  const data = (json && typeof json === 'object' && 'data' in json
    ? (json as { data?: Record<string, unknown> }).data
    : undefined) ?? {}

  return {
    name: typeof data.name === 'string' ? data.name : null,
    bio: typeof data.bio === 'string' ? data.bio : null,
    avatarUrl: typeof data.avatarUrl === 'string' ? data.avatarUrl : null,
    locationId: typeof data.locationId === 'string' ? data.locationId : null,
    locationCity: typeof data.locationCity === 'string' ? data.locationCity : null,
    locationNeighborhood: typeof data.locationNeighborhood === 'string' ? data.locationNeighborhood : null,
    email: typeof data.email === 'string' ? data.email : '',
    emailVerifiedAt: typeof data.emailVerifiedAt === 'string' ? data.emailVerifiedAt : null,
    isPublic: typeof data.isPublic === 'boolean' ? data.isPublic : true,
    notificationsEnabled: typeof data.notificationsEnabled === 'boolean' ? data.notificationsEnabled : true,
  }
}

export async function fetchProfileLocations(): Promise<ProfileLocationOption[]> {
  const res = await apiFetch('/api/locations')
  const json = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(readQueryErrorCode(json))
  }

  const rows: unknown[] = Array.isArray(json?.data) ? json.data : []

  return rows
    .filter((row: unknown): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
    .map((row: Record<string, unknown>) => ({
      id: typeof row.id === 'string' ? row.id : '',
      city: typeof row.city === 'string' ? row.city : '',
      neighborhood: typeof row.neighborhood === 'string' ? row.neighborhood : '',
    }))
    .filter((row: ProfileLocationOption) => row.id.length > 0)
}

export async function updateOwnProfile(input: UpdateProfileInput): Promise<void> {
  await patchOwnProfile({
    name: input.name,
    bio: input.bio,
    locationId: input.locationId,
    isPublic: input.isPublic,
    notificationsEnabled: input.notificationsEnabled,
  })
}

export async function patchOwnProfile(input: PatchProfileInput): Promise<void> {
  const body: Record<string, unknown> = {
    ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
    ...(input.locationId !== undefined ? { locationId: input.locationId ?? '' } : {}),
    ...(input.notificationsEnabled !== undefined ? { notificationsEnabled: input.notificationsEnabled } : {}),
  }

  if (typeof input.name === 'string' && input.name.trim()) body.name = input.name.trim()
  if (typeof input.bio === 'string' && input.bio.trim()) body.bio = input.bio.trim()
  if (input.avatarUrl !== undefined) body.avatarUrl = input.avatarUrl ?? ''

  const res = await apiFetch('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(readQueryErrorCode(json))
  }
}

export function profileUpdateErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    VALIDATION_ERROR: 'Please check your inputs.',
    LOCATION_NOT_FOUND: 'Invalid location selected.',
    TOO_MANY_REQUESTS: 'Too many attempts. Please wait.',
  }

  return messages[code] ?? 'Something went wrong.'
}