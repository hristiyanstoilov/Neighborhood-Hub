import { describe, it, expect } from 'vitest'
import { queryEvents, queryEventsPage, queryEventById } from '../events'
import { seed } from '@/test-integration-setup'

describe('queryEvents', () => {
  it('returns the seeded event', async () => {
    const rows = await queryEvents({})
    expect(rows.some((r) => r.id === seed.eventId)).toBe(true)
  })

  it('filters by status=published includes seeded event', async () => {
    const rows = await queryEvents({ status: 'published' })
    expect(rows.some((r) => r.id === seed.eventId)).toBe(true)
  })

  it('filters by status=cancelled excludes seeded event', async () => {
    const rows = await queryEvents({ status: 'cancelled' })
    expect(rows.some((r) => r.id === seed.eventId)).toBe(false)
  })

  it('filters by search term with ilike', async () => {
    const rows = await queryEvents({ search: 'cleanup' })
    expect(rows.some((r) => r.id === seed.eventId)).toBe(true)
  })
})

describe('queryEventsPage', () => {
  it('returns events array and total count', async () => {
    const result = await queryEventsPage({})
    expect(Array.isArray(result.events)).toBe(true)
    expect(typeof result.total).toBe('number')
    expect(result.total).toBeGreaterThanOrEqual(1)
  })
})

describe('queryEventById', () => {
  it('returns enriched event data', async () => {
    const event = await queryEventById(seed.eventId)
    expect(event).not.toBeNull()
    expect(event!.id).toBe(seed.eventId)
    expect(event!.title).toBe('Community Cleanup')
    expect(event!.organizerName).toBe('Owner User')
  })

  it('returns null for unknown id', async () => {
    const event = await queryEventById('00000000-0000-0000-0000-000000000000')
    expect(event).toBeNull()
  })
})
