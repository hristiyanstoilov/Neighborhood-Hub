import { apiFetch } from '../api'

export interface SkillListItem {
  id: string
  title: string
  status: string
  ownerName: string | null
  category: string | null
  imageUrl: string | null
}

export interface CategoryOption {
  id: string
  slug: string
  label: string
}

export interface LocationOption {
  id: string
  city: string
  neighborhood: string
}

export type SkillsFilters = {
  search: string
  categoryId: string | null
  locationId: string | null
}

export type SkillsPage = {
  skills: SkillListItem[]
  total: number
  page: number
  limit: number
}

export const skillsKeys = {
  all: ['skills'] as const,
  list: (filters: SkillsFilters, limit: number) =>
    [...skillsKeys.all, 'list', filters.search, filters.categoryId ?? '', filters.locationId ?? '', limit] as const,
  categories: () => [...skillsKeys.all, 'categories'] as const,
  locations: () => [...skillsKeys.all, 'locations'] as const,
}

function readErrorCode(json: unknown): string {
  if (json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string') {
    return (json as { error: string }).error
  }

  return 'UNKNOWN_ERROR'
}

export async function fetchCategories(): Promise<CategoryOption[]> {
  const res = await apiFetch('/api/categories')
  const json = await res.json()

  if (!res.ok) {
    throw new Error(readErrorCode(json))
  }

  return Array.isArray(json.data) ? json.data : []
}

export async function fetchLocations(): Promise<LocationOption[]> {
  const res = await apiFetch('/api/locations')
  const json = await res.json()

  if (!res.ok) {
    throw new Error(readErrorCode(json))
  }

  return Array.isArray(json.data) ? json.data : []
}

export async function fetchSkillsPage(input: {
  page: number
  limit: number
  search: string
  categoryId: string | null
  locationId: string | null
}): Promise<SkillsPage> {
  const params = new URLSearchParams({
    limit: String(input.limit),
    page: String(input.page),
  })

  if (input.search.trim()) params.set('search', input.search.trim())
  if (input.categoryId) params.set('categoryId', input.categoryId)
  if (input.locationId) params.set('locationId', input.locationId)

  const res = await apiFetch(`/api/skills?${params.toString()}`)
  const json = await res.json()

  if (!res.ok) {
    throw new Error(readErrorCode(json))
  }

  const rows = (json.data ?? []) as Array<{
    id: string
    title: string
    status: string
    ownerName: string | null
    categoryLabel: string | null
    imageUrl?: string | null
  }>

  const skills: SkillListItem[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    ownerName: row.ownerName,
    category: row.categoryLabel,
    imageUrl: row.imageUrl ?? null,
  }))

  return {
    skills,
    total: typeof json.total === 'number' ? json.total : skills.length,
    page: input.page,
    limit: input.limit,
  }
}