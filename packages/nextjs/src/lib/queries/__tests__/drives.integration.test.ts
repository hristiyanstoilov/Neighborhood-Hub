import { describe, it, expect } from 'vitest'
import { queryDrives, queryDrivesPage, queryDriveById } from '../drives'
import { seed } from '@/test-integration-setup'

describe('queryDrives', () => {
  it('returns the seeded drive', async () => {
    const rows = await queryDrives({})
    expect(rows.some((r) => r.id === seed.driveId)).toBe(true)
  })

  it('filters by status=open includes seeded drive', async () => {
    const rows = await queryDrives({ status: 'open' })
    expect(rows.some((r) => r.id === seed.driveId)).toBe(true)
  })

  it('filters by status=closed excludes seeded drive', async () => {
    const rows = await queryDrives({ status: 'closed' })
    expect(rows.some((r) => r.id === seed.driveId)).toBe(false)
  })

  it('filters by search term with ilike', async () => {
    const rows = await queryDrives({ search: 'clothes' })
    expect(rows.some((r) => r.id === seed.driveId)).toBe(true)
  })
})

describe('queryDrivesPage', () => {
  it('returns drives and total', async () => {
    const result = await queryDrivesPage({})
    expect(Array.isArray(result.drives)).toBe(true)
    expect(typeof result.total).toBe('number')
    expect(result.total).toBeGreaterThanOrEqual(1)
  })
})

describe('queryDriveById', () => {
  it('returns enriched drive data', async () => {
    const row = await queryDriveById(seed.driveId)
    expect(row).not.toBeNull()
    expect(row!.id).toBe(seed.driveId)
    expect(row!.title).toBe('Winter Clothes Drive')
    expect(row!.organizerName).toBe('Owner User')
  })

  it('returns null for unknown id', async () => {
    const row = await queryDriveById('00000000-0000-0000-0000-000000000000')
    expect(row).toBeNull()
  })
})
