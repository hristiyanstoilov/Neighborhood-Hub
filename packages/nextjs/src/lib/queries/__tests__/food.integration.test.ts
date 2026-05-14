import { describe, it, expect } from 'vitest'
import {
  queryFoodShares,
  queryFoodSharesPage,
  queryFoodShareById,
  queryFoodReservationUsage,
  queryUserFoodReservation,
  queryFoodReservations,
  queryFoodReservationsForUser,
} from '../food'
import { seed } from '@/test-integration-setup'

describe('queryFoodShares', () => {
  it('returns the seeded food share', async () => {
    const rows = await queryFoodShares({})
    expect(rows.some((r) => r.id === seed.foodShareId)).toBe(true)
  })

  it('filters by status=available — includes seeded food share', async () => {
    const rows = await queryFoodShares({ status: 'available' })
    expect(rows.some((r) => r.id === seed.foodShareId)).toBe(true)
  })

  it('filters by status=consumed — excludes seeded food share', async () => {
    const rows = await queryFoodShares({ status: 'consumed' })
    expect(rows.some((r) => r.id === seed.foodShareId)).toBe(false)
  })

  it('filters by search term (case-insensitive ilike)', async () => {
    const found = await queryFoodShares({ search: 'tomato' })
    expect(found.some((r) => r.id === seed.foodShareId)).toBe(true)

    const notFound = await queryFoodShares({ search: 'xyzunknown99' })
    expect(notFound.some((r) => r.id === seed.foodShareId)).toBe(false)
  })

  it('filters by ownerId', async () => {
    const rows = await queryFoodShares({ ownerId: seed.ownerUserId })
    expect(rows.some((r) => r.id === seed.foodShareId)).toBe(true)
    expect(rows.every((r) => r.ownerId === seed.ownerUserId)).toBe(true)
  })

  it('respects limit parameter', async () => {
    const rows = await queryFoodShares({ limit: 1 })
    expect(rows.length).toBeLessThanOrEqual(1)
  })
})

describe('queryFoodSharesPage', () => {
  it('returns { foodShares, total } shape', async () => {
    const result = await queryFoodSharesPage({})
    expect(Array.isArray(result.foodShares)).toBe(true)
    expect(typeof result.total).toBe('number')
  })

  it('total is at least 1 after seeding', async () => {
    const result = await queryFoodSharesPage({})
    expect(result.total).toBeGreaterThanOrEqual(1)
  })

  it('total reflects status filter', async () => {
    const available = await queryFoodSharesPage({ status: 'available' })
    expect(available.total).toBeGreaterThanOrEqual(1)

    const consumed = await queryFoodSharesPage({ status: 'consumed' })
    expect(consumed.total).toBe(0)
  })
})

describe('queryFoodShareById', () => {
  it('returns enriched food share data', async () => {
    const share = await queryFoodShareById(seed.foodShareId)
    expect(share).not.toBeNull()
    expect(share!.id).toBe(seed.foodShareId)
    expect(share!.title).toBe('Fresh Tomatoes')
    expect(share!.description).toBe('Garden tomatoes')
    expect(share!.ownerName).toBe('Owner User')
    expect(share!.locationCity).toBe('Sofia')
    expect(share!.locationNeighborhood).toBe('Test Neighborhood')
  })

  it('returns null for an unknown id', async () => {
    const result = await queryFoodShareById('00000000-0000-0000-0000-000000000000')
    expect(result).toBeNull()
  })
})

describe('queryFoodReservationUsage', () => {
  it('returns { activeCount, pickedUpCount } shape', async () => {
    const result = await queryFoodReservationUsage(seed.foodShareId)
    expect(typeof result.activeCount).toBe('number')
    expect(typeof result.pickedUpCount).toBe('number')
  })
})

describe('queryUserFoodReservation', () => {
  it('returns reservation for requester in seeded food share', async () => {
    const result = await queryUserFoodReservation(seed.foodShareId, seed.requesterUserId)
    expect(result).not.toBeNull()
    expect(result!.id).toBe(seed.foodReservationId)
    expect(result!.status).toBe('pending')
  })

  it('returns null when no reservation exists', async () => {
    const result = await queryUserFoodReservation(seed.foodShareId, seed.ownerUserId)
    expect(result).toBeNull()
  })
})

describe('queryFoodReservations', () => {
  it('returns list of reservations for food share', async () => {
    const rows = await queryFoodReservations(seed.foodShareId)
    expect(Array.isArray(rows)).toBe(true)
    expect(rows.some((r) => r.id === seed.foodReservationId)).toBe(true)
  })

  it('returns reservation with requester name', async () => {
    const rows = await queryFoodReservations(seed.foodShareId)
    const reservation = rows.find((r) => r.id === seed.foodReservationId)
    expect(reservation).not.toBeUndefined()
    expect(reservation!.requesterName).toBe('Requester User')
  })

  it('respects limit parameter', async () => {
    const rows = await queryFoodReservations(seed.foodShareId, { limit: 1 })
    expect(rows.length).toBeLessThanOrEqual(1)
  })
})

describe('queryFoodReservationsForUser', () => {
  it('returns reservations for requester', async () => {
    const rows = await queryFoodReservationsForUser(seed.requesterUserId, 'requester')
    expect(Array.isArray(rows)).toBe(true)
    expect(rows.some((r) => r.id === seed.foodReservationId)).toBe(true)
  })

  it('reservation includes food share title', async () => {
    const rows = await queryFoodReservationsForUser(seed.requesterUserId, 'requester')
    const reservation = rows.find((r) => r.id === seed.foodReservationId)
    expect(reservation).not.toBeUndefined()
    expect(reservation!.foodShareTitle).toBe('Fresh Tomatoes')
  })

  it('returns reservations for owner', async () => {
    const rows = await queryFoodReservationsForUser(seed.ownerUserId, 'owner')
    expect(Array.isArray(rows)).toBe(true)
    expect(rows.some((r) => r.id === seed.foodReservationId)).toBe(true)
  })

  it('returns empty array for unknown requester id', async () => {
    const rows = await queryFoodReservationsForUser('00000000-0000-0000-0000-000000000000', 'requester')
    expect(rows).toEqual([])
  })
})
