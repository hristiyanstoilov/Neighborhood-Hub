import { apiFetch } from '../api'

export interface EventListItem {
  id: string
  title: string
  status: string
  startsAt: string
  endsAt: string | null
  address: string | null
  imageUrl: string | null
  maxCapacity: number | null
  organizerName: string | null
  organizerId: string
  locationNeighborhood: string | null
  locationCity: string | null
}

export interface EventDetail extends EventListItem {
  description: string | null
  attendeeCount: number
  updatedAt: string
}

export type EventsFilters = {
  status: string
}

export const eventsKeys = {
  all:    ['events'] as const,
  list:   (status: string) => [...eventsKeys.all, 'list', status] as const,
  detail: (id: string)     => [...eventsKeys.all, 'detail', id] as const,
}

function readErrorCode(json: unknown): string {
  if (json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string') {
    return (json as { error: string }).error
  }
  return 'UNKNOWN_ERROR'
}

export async function fetchEventsList(input: { status?: string; page?: number; limit?: number }): Promise<{
  data: EventListItem[]
  total: number
  page: number
}> {
  const params = new URLSearchParams({
    limit: String(input.limit ?? 20),
    page:  String(input.page ?? 1),
  })
  if (input.status) params.set('status', input.status)

  const res = await apiFetch(`/api/events?${params.toString()}`)
  const json = await res.json()
  if (!res.ok) throw new Error(readErrorCode(json))

  return {
    data:  (json.data ?? []) as EventListItem[],
    total: typeof json.total === 'number' ? json.total : 0,
    page:  typeof json.page  === 'number' ? json.page  : 1,
  }
}

export async function fetchEventDetail(id: string): Promise<EventDetail> {
  const res = await apiFetch(`/api/events/${id}`)
  const json = await res.json()
  if (!res.ok) throw new Error(readErrorCode(json))
  return json.data as EventDetail
}

export class EventNotFoundError extends Error {
  constructor() { super('NOT_FOUND') }
}
