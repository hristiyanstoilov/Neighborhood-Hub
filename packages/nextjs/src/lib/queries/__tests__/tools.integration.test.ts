import { describe, it, expect } from 'vitest'
import { queryTools, queryToolsPage, queryToolById } from '../tools'
import { seed } from '@/test-integration-setup'

describe('queryTools', () => {
  it('returns the seeded tool', async () => {
    const rows = await queryTools({})
    expect(rows.some((r) => r.id === seed.toolId)).toBe(true)
  })

  it('filters by status=available — includes seeded tool', async () => {
    const rows = await queryTools({ status: 'available' })
    expect(rows.some((r) => r.id === seed.toolId)).toBe(true)
  })

  it('filters by status=in_use — excludes seeded tool', async () => {
    const rows = await queryTools({ status: 'in_use' })
    expect(rows.some((r) => r.id === seed.toolId)).toBe(false)
  })

  it('filters by search term (case-insensitive ilike)', async () => {
    const found = await queryTools({ search: 'drill' })
    expect(found.some((r) => r.id === seed.toolId)).toBe(true)

    const notFound = await queryTools({ search: 'xyzunknown99' })
    expect(notFound.some((r) => r.id === seed.toolId)).toBe(false)
  })

  it('filters by ownerId', async () => {
    const rows = await queryTools({ ownerId: seed.ownerUserId })
    expect(rows.some((r) => r.id === seed.toolId)).toBe(true)
    expect(rows.every((r) => r.ownerId === seed.ownerUserId)).toBe(true)
  })

  it('filters by categoryId', async () => {
    const rows = await queryTools({ categoryId: seed.categoryId })
    expect(rows.some((r) => r.id === seed.toolId)).toBe(true)
  })

  it('filters by locationId', async () => {
    const rows = await queryTools({ locationId: seed.locationId })
    expect(rows.some((r) => r.id === seed.toolId)).toBe(true)
  })

  it('respects limit parameter', async () => {
    const rows = await queryTools({ limit: 1 })
    expect(rows.length).toBeLessThanOrEqual(1)
  })
})

describe('queryToolsPage', () => {
  it('returns { tools, total } shape', async () => {
    const result = await queryToolsPage({})
    expect(Array.isArray(result.tools)).toBe(true)
    expect(typeof result.total).toBe('number')
  })

  it('total is at least 1 after seeding', async () => {
    const result = await queryToolsPage({})
    expect(result.total).toBeGreaterThanOrEqual(1)
  })

  it('total reflects status filter', async () => {
    const available = await queryToolsPage({ status: 'available' })
    expect(available.total).toBeGreaterThanOrEqual(1)

    const inUse = await queryToolsPage({ status: 'in_use' })
    expect(inUse.total).toBe(0)
  })
})

describe('queryToolById', () => {
  it('returns enriched tool data', async () => {
    const tool = await queryToolById(seed.toolId)
    expect(tool).not.toBeNull()
    expect(tool!.id).toBe(seed.toolId)
    expect(tool!.title).toBe('Power Drill')
    expect(tool!.ownerName).toBe('Owner User')
    expect(tool!.categoryLabel).toBe('Test Category')
    expect(tool!.locationCity).toBe('Sofia')
    expect(tool!.locationNeighborhood).toBe('Test Neighborhood')
  })

  it('returns null for an unknown id', async () => {
    const result = await queryToolById('00000000-0000-0000-0000-000000000000')
    expect(result).toBeNull()
  })
})
