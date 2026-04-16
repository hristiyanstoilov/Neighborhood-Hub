import { apiFetch } from '../api'

export interface ToolListItem {
  id: string
  title: string
  status: string
  condition: string | null
  ownerName: string | null
  categoryLabel: string | null
  locationNeighborhood: string | null
  locationCity: string | null
  imageUrl: string | null
}

export interface ToolDetail extends ToolListItem {
  description: string | null
  ownerId: string
  categoryId: string | null
  locationId: string | null
}

export type ToolsFilters = {
  search: string
  categoryId: string | null
  locationId: string | null
  status: string | null
}

export type ToolsPage = {
  tools: ToolListItem[]
  total: number
  page: number
  limit: number
}

export const toolsKeys = {
  all:    ['tools'] as const,
  list:   (filters: ToolsFilters, page: number, limit: number) =>
    [...toolsKeys.all, 'list', filters.search, filters.categoryId ?? '', filters.locationId ?? '', filters.status ?? '', page, limit] as const,
  detail: (id: string) => [...toolsKeys.all, 'detail', id] as const,
}

function readErrorCode(json: unknown): string {
  if (json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string') {
    return (json as { error: string }).error
  }
  return 'UNKNOWN_ERROR'
}

export async function fetchToolsPage(input: {
  page: number
  limit: number
  search: string
  categoryId: string | null
  locationId: string | null
  status: string | null
}): Promise<ToolsPage> {
  const params = new URLSearchParams({
    limit: String(input.limit),
    page:  String(input.page),
  })
  if (input.search.trim()) params.set('search', input.search.trim())
  if (input.categoryId)    params.set('categoryId', input.categoryId)
  if (input.locationId)    params.set('locationId', input.locationId)
  if (input.status)        params.set('status', input.status)

  const res = await apiFetch(`/api/tools?${params.toString()}`)
  const json = await res.json()
  if (!res.ok) throw new Error(readErrorCode(json))

  const rows = (json.data ?? []) as ToolListItem[]
  return {
    tools: rows,
    total: typeof json.total === 'number' ? json.total : rows.length,
    page:  input.page,
    limit: input.limit,
  }
}

export async function fetchToolDetail(id: string): Promise<ToolDetail> {
  const res = await apiFetch(`/api/tools/${id}`)
  const json = await res.json()
  if (!res.ok) throw new Error(readErrorCode(json))
  return json.data as ToolDetail
}

export class ToolNotFoundError extends Error {
  constructor() { super('TOOL_NOT_FOUND') }
}
