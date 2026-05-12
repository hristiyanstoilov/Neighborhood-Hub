import { describe, it, expect } from 'vitest'
import { querySkillRequestsByUser, countSkillRequestsByUser } from '../skill-requests'
import { seed } from '@/test-integration-setup'

describe('querySkillRequestsByUser', () => {
  it('returns requests when user is either requester or owner', async () => {
    const rows = await querySkillRequestsByUser(seed.requesterUserId, { page: 1, limit: 10 })
    expect(rows.some((r) => r.id === seed.skillRequestId)).toBe(true)
  })

  it('role=requester — includes request, owner user excluded', async () => {
    const asRequester = await querySkillRequestsByUser(seed.requesterUserId, {
      role: 'requester', page: 1, limit: 10,
    })
    expect(asRequester.some((r) => r.id === seed.skillRequestId)).toBe(true)

    const wrongRole = await querySkillRequestsByUser(seed.requesterUserId, {
      role: 'owner', page: 1, limit: 10,
    })
    expect(wrongRole.some((r) => r.id === seed.skillRequestId)).toBe(false)
  })

  it('role=owner — owner sees the request, requester excluded as owner', async () => {
    const asOwner = await querySkillRequestsByUser(seed.ownerUserId, {
      role: 'owner', page: 1, limit: 10,
    })
    expect(asOwner.some((r) => r.id === seed.skillRequestId)).toBe(true)

    const wrongRole = await querySkillRequestsByUser(seed.ownerUserId, {
      role: 'requester', page: 1, limit: 10,
    })
    expect(wrongRole.some((r) => r.id === seed.skillRequestId)).toBe(false)
  })

  it('filters by status=pending — includes seeded request', async () => {
    const rows = await querySkillRequestsByUser(seed.requesterUserId, {
      status: 'pending', page: 1, limit: 10,
    })
    expect(rows.some((r) => r.id === seed.skillRequestId)).toBe(true)
  })

  it('filters by status=accepted — excludes pending request', async () => {
    const rows = await querySkillRequestsByUser(seed.requesterUserId, {
      status: 'accepted', page: 1, limit: 10,
    })
    expect(rows.some((r) => r.id === seed.skillRequestId)).toBe(false)
  })

  it('returns empty for an unrelated user', async () => {
    const rows = await querySkillRequestsByUser('00000000-0000-0000-0000-000000000000', {
      page: 1, limit: 10,
    })
    expect(rows).toHaveLength(0)
  })

  it('respects limit parameter', async () => {
    const rows = await querySkillRequestsByUser(seed.requesterUserId, { page: 1, limit: 1 })
    expect(rows.length).toBeLessThanOrEqual(1)
  })
})

describe('countSkillRequestsByUser', () => {
  it('counts all requests for the requester', async () => {
    const total = await countSkillRequestsByUser(seed.requesterUserId, {})
    expect(total).toBeGreaterThanOrEqual(1)
  })

  it('counts correctly by role', async () => {
    const asRequester = await countSkillRequestsByUser(seed.requesterUserId, { role: 'requester' })
    expect(asRequester).toBeGreaterThanOrEqual(1)

    const asOwner = await countSkillRequestsByUser(seed.requesterUserId, { role: 'owner' })
    expect(asOwner).toBe(0)
  })

  it('counts correctly by status', async () => {
    const pending = await countSkillRequestsByUser(seed.requesterUserId, { status: 'pending' })
    expect(pending).toBeGreaterThanOrEqual(1)

    const completed = await countSkillRequestsByUser(seed.requesterUserId, { status: 'completed' })
    expect(completed).toBe(0)
  })

  it('returns 0 for an unrelated user', async () => {
    const total = await countSkillRequestsByUser('00000000-0000-0000-0000-000000000000', {})
    expect(total).toBe(0)
  })
})
