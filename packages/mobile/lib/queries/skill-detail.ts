import { apiFetch } from '../api'

export class SkillNotFoundError extends Error {
  constructor() {
    super('SKILL_NOT_FOUND')
  }
}

export interface SkillDetail {
  id: string
  title: string
  description: string | null
  status: string
  availableHours: number | null
  imageUrl: string | null
  ownerId: string
  ownerName: string | null
  categoryId: string | null
  locationId: string | null
  category: string | null
  location: string | null
}

export const skillDetailKeys = {
  all: ['skill-detail'] as const,
  detail: (id: string) => [...skillDetailKeys.all, id] as const,
}

function readErrorCode(json: unknown): string {
  if (json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string') {
    return (json as { error: string }).error
  }

  return 'UNKNOWN_ERROR'
}

export async function fetchSkillDetail(id: string): Promise<SkillDetail> {
  const res = await apiFetch(`/api/skills/${id}`)

  if (res.status === 404) {
    throw new SkillNotFoundError()
  }

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(readErrorCode(json))
  }

  const source = json?.data

  return {
    id: source.id,
    title: source.title,
    description: source.description ?? null,
    status: source.status,
    availableHours: source.availableHours ?? null,
    imageUrl: source.imageUrl ?? null,
    ownerId: source.ownerId,
    ownerName: source.ownerName ?? null,
    categoryId: source.categoryId ?? null,
    locationId: source.locationId ?? null,
    category: source.categoryLabel ?? null,
    location: source.locationNeighborhood
      ? `${source.locationNeighborhood}, ${source.locationCity ?? ''}`
      : null,
  }
}