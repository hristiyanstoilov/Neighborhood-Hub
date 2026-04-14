import { apiFetch } from '../api'

export interface MySkillItem {
  id: string
  title: string
  status: string
  imageUrl: string | null
  categoryLabel: string | null
  locationNeighborhood: string | null
}

export interface MySkillsPage {
  skills: MySkillItem[]
  total: number
  page: number
  limit: number
}

export const mySkillsKeys = {
  all: ['my-skills'] as const,
  list: (limit: number) => [...mySkillsKeys.all, 'list', limit] as const,
}

function readErrorCode(json: unknown): string {
  if (json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string') {
    return (json as { error: string }).error
  }

  return 'UNKNOWN_ERROR'
}

export async function fetchMySkillsPage(input: { page: number; limit: number }): Promise<MySkillsPage> {
  const res = await apiFetch(`/api/profile/skills?limit=${input.limit}&page=${input.page}`)
  const json = await res.json()

  if (!res.ok) {
    throw new Error(readErrorCode(json))
  }

  const rows = (json.data ?? []) as Array<{
    id: string
    title: string
    status: string
    imageUrl?: string | null
    categoryLabel?: string | null
    locationNeighborhood?: string | null
  }>

  const skills: MySkillItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    imageUrl: row.imageUrl ?? null,
    categoryLabel: row.categoryLabel ?? null,
    locationNeighborhood: row.locationNeighborhood ?? null,
  }))

  return {
    skills,
    total: typeof json.total === 'number' ? json.total : skills.length,
    page: input.page,
    limit: input.limit,
  }
}