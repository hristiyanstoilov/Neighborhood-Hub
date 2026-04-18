import { apiFetch } from '../api'

export interface FoodShareListItem {
  id: string
  title: string
  description: string | null
  quantity: number
  locationCity: string | null
  locationNeighborhood: string | null
  availableUntil: string | null
  pickupInstructions: string | null
  imageUrl: string | null
  status: string
  createdAt: string
  ownerId: string
  ownerName: string | null
  activeReservations: number
  remainingQuantity: number
}

export interface FoodShareDetail extends FoodShareListItem {
  reservationCount: number
  updatedAt: string
}

// Base shape returned by GET /api/food-shares/{id}/reservations
export interface FoodReservation {
  id: string
  foodShareId?: string
  foodShareTitle?: string
  foodShareImageUrl?: string | null
  requesterId: string
  ownerId: string
  pickupAt: string
  status: string
  notes: string | null
  cancellationReason: string | null
  pickedUpAt: string | null
  createdAt: string
  requesterName: string | null
}

// Extended shape returned by GET /api/food-reservations (includes food share metadata)
export interface FoodReservationWithShare extends FoodReservation {
  foodShareId: string
  foodShareTitle: string
  foodShareImageUrl: string | null
}

export const foodKeys = {
  all: ['food'] as const,
  list: (status: string) => [...foodKeys.all, 'list', status] as const,
  detail: (id: string) => [...foodKeys.all, 'detail', id] as const,
  reservations: (id: string) => [...foodKeys.all, 'reservations', id] as const,
  userReservations: (role: 'requester' | 'owner') => [...foodKeys.all, 'user-reservations', role] as const,
}

function readErrorCode(json: unknown): string {
  if (json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string') {
    return (json as { error: string }).error
  }
  return 'UNKNOWN_ERROR'
}

export async function fetchFoodList(input: { status?: string; page?: number; limit?: number }): Promise<{
  data: FoodShareListItem[]
  total: number
  page: number
}> {
  const params = new URLSearchParams({
    limit: String(input.limit ?? 20),
    page: String(input.page ?? 1),
  })
  if (input.status) params.set('status', input.status)

  const res = await apiFetch(`/api/food-shares?${params.toString()}`)
  const json = await res.json()
  if (!res.ok) throw new Error(readErrorCode(json))

  return {
    data: (json.data ?? []) as FoodShareListItem[],
    total: typeof json.total === 'number' ? json.total : 0,
    page: typeof json.page === 'number' ? json.page : 1,
  }
}

export async function fetchFoodDetail(id: string): Promise<FoodShareDetail> {
  const res = await apiFetch(`/api/food-shares/${id}`)
  const json = await res.json()
  if (!res.ok) throw new Error(readErrorCode(json))
  return json.data as FoodShareDetail
}

export async function fetchFoodReservations(id: string): Promise<FoodReservation[]> {
  const res = await apiFetch(`/api/food-shares/${id}/reservations`)
  const json = await res.json()
  if (!res.ok) throw new Error(readErrorCode(json))
  return (json.data ?? []) as FoodReservation[]
}

export async function fetchFoodReservationsForUser(role: 'requester' | 'owner'): Promise<FoodReservationWithShare[]> {
  const params = new URLSearchParams({ role })
  const res = await apiFetch(`/api/food-reservations?${params.toString()}`)
  const json = await res.json()
  if (!res.ok) throw new Error(readErrorCode(json))
  return (json.data ?? []) as FoodReservationWithShare[]
}