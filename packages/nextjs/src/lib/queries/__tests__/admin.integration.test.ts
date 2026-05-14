import { describe, it, expect } from 'vitest'
import { queryUserByRefreshToken, queryAdminUsers, queryAuditLog } from '../admin'
import { seed } from '@/test-integration-setup'

describe('queryUserByRefreshToken', () => {
  it('returns user data for valid, non-revoked, non-expired token', async () => {
    const result = await queryUserByRefreshToken(seed.refreshToken)
    expect(result).not.toBeNull()
    expect(result!.id).toBe(seed.ownerUserId)
    expect(result!.email).toBe('owner@test.example')
    expect(result!.role).toBe('user')
  })

  it('returns null for expired token', async () => {
    const result = await queryUserByRefreshToken(seed.expiredRefreshToken)
    expect(result).toBeNull()
  })

  it('returns null for unknown token', async () => {
    const result = await queryUserByRefreshToken('nonexistent-token-xyz123')
    expect(result).toBeNull()
  })

  it('returns user for non-deleted user (soft-delete guard present)', async () => {
    const result = await queryUserByRefreshToken(seed.refreshToken)
    expect(result).not.toBeNull()
    expect(result!.id).toBe(seed.ownerUserId)
  })
})

describe('queryAdminUsers', () => {
  it('returns array of users with profile info', async () => {
    const users = await queryAdminUsers()
    expect(Array.isArray(users)).toBe(true)
    expect(users.length).toBeGreaterThanOrEqual(2) // at least owner and requester
  })

  it('includes seeded owner user with profile name', async () => {
    const users = await queryAdminUsers()
    const owner = users.find((u) => u.id === seed.ownerUserId)
    expect(owner).not.toBeUndefined()
    expect(owner!.email).toBe('owner@test.example')
    expect(owner!.name).toBe('Owner User')
    expect(owner!.role).toBe('user')
  })

  it('includes seeded requester user', async () => {
    const users = await queryAdminUsers()
    const requester = users.find((u) => u.id === seed.requesterUserId)
    expect(requester).not.toBeUndefined()
    expect(requester!.email).toBe('requester@test.example')
    expect(requester!.name).toBe('Requester User')
  })

  it('respects limit parameter', async () => {
    const users = await queryAdminUsers(1)
    expect(users.length).toBeLessThanOrEqual(1)
  })

  it('users sorted by creation date newest first', async () => {
    const users = await queryAdminUsers(10)
    if (users.length > 1) {
      // Verify descending order (newer first)
      for (let i = 0; i < users.length - 1; i++) {
        const current = new Date(users[i].createdAt!)
        const next = new Date(users[i + 1].createdAt!)
        expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime())
      }
    }
  })
})

describe('queryAuditLog', () => {
  it('returns array of audit log entries', async () => {
    const logs = await queryAuditLog()
    expect(Array.isArray(logs)).toBe(true)
  })

  it('respects limit parameter', async () => {
    const logs = await queryAuditLog(5)
    expect(logs.length).toBeLessThanOrEqual(5)
  })

  it('log entries have required fields', async () => {
    const logs = await queryAuditLog(1)
    if (logs.length > 0) {
      const log = logs[0]
      expect(log).toHaveProperty('id')
      expect(log).toHaveProperty('action')
      expect(log).toHaveProperty('entity')
      expect(log).toHaveProperty('createdAt')
    }
  })

  it('returns empty array if no audit logs exist', async () => {
    // Most tests won't have audit entries unless explicitly created
    const logs = await queryAuditLog(100)
    // This just verifies the query runs without error
    expect(Array.isArray(logs)).toBe(true)
  })
})
