import { apiFetch } from '../api'

export type SkillSearchResult = {
  id: string
  title: string
  description: string | null
  status: string
  ownerName: string | null
}

export type ToolSearchResult = {
  id: string
  title: string
  description: string | null
  status: string
  condition: string | null
  ownerName: string | null
}

export type EventSearchResult = {
  id: string
  title: string
  description: string | null
  status: string
  startsAt: string
  address: string | null
}

export type DriveSearchResult = {
  id: string
  title: string
  description: string | null
  status: string
  driveType: string
  deadline: string | null
}

export type FoodSearchResult = {
  id: string
  title: string
  description: string | null
  status: string
  quantity: number
  availableUntil: string | null
}

export type SearchResultsData = {
  query: string
  skills: SkillSearchResult[]
  tools: ToolSearchResult[]
  events: EventSearchResult[]
  drives: DriveSearchResult[]
  food: FoodSearchResult[]
  totalByType: {
    skills: number
    tools: number
    events: number
    drives: number
    food: number
  }
}

export const searchKeys = {
  all: ['search'] as const,
  results: (q: string) => [...searchKeys.all, 'results', q] as const,
}

function readErrorCode(json: unknown): string {
  if (json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string') {
    return (json as { error: string }).error
  }
  return 'UNKNOWN_ERROR'
}

export async function fetchSearchResults(input: { q: string; locationId?: string }): Promise<SearchResultsData> {
  const params = new URLSearchParams({ q: input.q.trim(), limit: '8' })
  if (input.locationId) params.set('locationId', input.locationId)

  const res = await apiFetch(`/api/search?${params.toString()}`)
  const json = await res.json()

  if (!res.ok) throw new Error(readErrorCode(json))

  return json.data as SearchResultsData
}
