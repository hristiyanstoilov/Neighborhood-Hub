import { describe, it, expect } from 'vitest'
import { querySkills, querySkillsPage, querySkillById } from '../skills'
import { seed } from '@/test-integration-setup'

describe('querySkills', () => {
  it('returns the seeded skill', async () => {
    const rows = await querySkills({})
    expect(rows.some((r) => r.id === seed.skillId)).toBe(true)
  })

  it('filters by status=available — includes seeded skill', async () => {
    const rows = await querySkills({ status: 'available' })
    expect(rows.some((r) => r.id === seed.skillId)).toBe(true)
  })

  it('filters by status=busy — excludes seeded skill', async () => {
    const rows = await querySkills({ status: 'busy' })
    expect(rows.some((r) => r.id === seed.skillId)).toBe(false)
  })

  it('filters by search term (case-insensitive ilike)', async () => {
    const found = await querySkills({ search: 'yoga' })
    expect(found.some((r) => r.id === seed.skillId)).toBe(true)

    const notFound = await querySkills({ search: 'xyzunknown99' })
    expect(notFound.some((r) => r.id === seed.skillId)).toBe(false)
  })

  it('filters by ownerId', async () => {
    const rows = await querySkills({ ownerId: seed.ownerUserId })
    expect(rows.some((r) => r.id === seed.skillId)).toBe(true)
    expect(rows.every((r) => r.ownerId === seed.ownerUserId)).toBe(true)
  })

  it('filters by categoryId', async () => {
    const rows = await querySkills({ categoryId: seed.categoryId })
    expect(rows.some((r) => r.id === seed.skillId)).toBe(true)
  })

  it('filters by locationId', async () => {
    const rows = await querySkills({ locationId: seed.locationId })
    expect(rows.some((r) => r.id === seed.skillId)).toBe(true)
  })

  it('respects limit parameter', async () => {
    const rows = await querySkills({ limit: 1 })
    expect(rows.length).toBeLessThanOrEqual(1)
  })

  it('does not return soft-deleted skills', async () => {
    const rows = await querySkills({})
    expect(rows.some((r) => r.id === seed.deletedSkillId)).toBe(false)
  })
})

describe('querySkillsPage', () => {
  it('returns { skills, total } shape', async () => {
    const result = await querySkillsPage({})
    expect(Array.isArray(result.skills)).toBe(true)
    expect(typeof result.total).toBe('number')
  })

  it('total is at least 1 after seeding', async () => {
    const result = await querySkillsPage({})
    expect(result.total).toBeGreaterThanOrEqual(1)
  })

  it('total matches filtered count', async () => {
    const all      = await querySkillsPage({})
    const filtered = await querySkillsPage({ status: 'available' })
    expect(filtered.total).toBeLessThanOrEqual(all.total)
    expect(filtered.total).toBeGreaterThanOrEqual(1)
  })
})

describe('querySkillById', () => {
  it('returns enriched skill data', async () => {
    const skill = await querySkillById(seed.skillId)
    expect(skill).not.toBeNull()
    expect(skill!.id).toBe(seed.skillId)
    expect(skill!.title).toBe('Yoga Classes')
    expect(skill!.ownerName).toBe('Owner User')
    expect(skill!.categoryLabel).toBe('Test Category')
    expect(skill!.locationCity).toBe('Sofia')
    expect(skill!.locationNeighborhood).toBe('Test Neighborhood')
  })

  it('returns null for an unknown id', async () => {
    const result = await querySkillById('00000000-0000-0000-0000-000000000000')
    expect(result).toBeNull()
  })
})
