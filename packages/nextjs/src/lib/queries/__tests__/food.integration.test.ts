import { describe, it, expect } from 'vitest'
import {
  queryFoodShares,
  queryFoodShareById,
  queryFoodReservationsForUser,
} from '../food'
import { seed } from '@/test-integration-setup'

describe('queryFoodShares', () => {
  it('returns the seeded food share', async () => {
    const rows = await queryFoodShares({})
    expect(rows.some((r) => r.id === seed.foodShareId)).toBe(true)
  })

  it('filters by status=available includes seeded food share', async () => {
    const rows = await queryFoodShares({ status: 'available' })
    expect(rows.some((r) => r.id === seed.foodShareId)).toBe(true)
  })

  it('filters by status=consumed excludes seeded food share', async () => {
    const rows = await queryFoodShares({ status: 'consumed' })
    expect(rows.some((r) => r.id === seed.foodShareId)).toBe(false)
  })

  it('filters by search term with case-insensitive ilike', async () => {
    const found = await queryFoodShares({ search: 'tomato' })
    expect(found.some((r) => r.id === seed.foodShareId)).toBe(true)
  })

  it('filters by ownerId', async () => {
    const rows = await queryFoodShares({ ownerId: seed.ownerUserId })
    expect(rows.some((r) => r.id === seed.foodShareId)).toBe(true)
    expect(rows.every((r) => r.ownerId === seed.ownerUserId)).toBe(true)
  })
})

describe('queryFoodShareById', () => {
  it('returns enriched food share data', async () => {
    const row = await queryFoodShareById(seed.foodShareId)
    expect(row).not.toBeNull()
    expect(row!.id).toBe(seed.foodShareId)
    expect(row!.title).toBe('Fresh Tomatoes')
    expect(row!.ownerName).toBe('Owner User')
    expect(row!.locationCity).toBe('Sofia')
  })

  it('returns null for unknown id', async () => {
    const row = await queryFoodShareById('00000000-0000-0000-0000-000000000000')
    expect(row).toBeNull()
  })
})

describe('queryFoodReservationsForUser', () => {
  it('returns reservation for requester role', async () => {
    const rows = await queryFoodReservationsForUser(seed.requesterUserId, 'requester', 20, 0)
    expect(rows.some((r) => r.id === seed.foodReservationId)).toBe(true)
  })

  it('returns reservation for owner role', async () => {
    const rows = await queryFoodReservationsForUser(seed.ownerUserId, 'owner', 20, 0)
    expect(rows.some((r) => r.id === seed.foodReservationId)).toBe(true)
  })

  it('returns empty array for unknown requester id', async () => {
    const rows = await queryFoodReservationsForUser('00000000-0000-0000-0000-000000000000', 'requester', 20, 0)
    expect(rows).toEqual([])
  })
})
