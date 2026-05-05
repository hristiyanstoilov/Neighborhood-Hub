import { describe, it, expect } from 'vitest'
import { isUniqueViolation } from './db-errors'

describe('isUniqueViolation', () => {
  it('returns true for an error with code 23505', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true)
  })

  it('returns true for an error with "duplicate key value" in message', () => {
    expect(isUniqueViolation(new Error('duplicate key value violates unique constraint'))).toBe(true)
  })

  it('returns true when 23505 is nested inside .cause', () => {
    const inner = { code: '23505' }
    const outer = new Error('query failed')
    ;(outer as unknown as { cause: unknown }).cause = inner
    expect(isUniqueViolation(outer)).toBe(true)
  })

  it('returns true when cause chain is two levels deep', () => {
    const root = { code: '23505' }
    const mid = { message: 'db error', cause: root }
    const top = new Error('request failed')
    ;(top as unknown as { cause: unknown }).cause = mid
    expect(isUniqueViolation(top)).toBe(true)
  })

  it('returns true when message contains the indexHint', () => {
    const err = new Error('duplicate key value violates unique constraint "food_reservations_active_idx"')
    expect(isUniqueViolation(err, 'food_reservations_active_idx')).toBe(true)
  })

  it('returns false for a different PG error code (FK violation 23503)', () => {
    expect(isUniqueViolation({ code: '23503' })).toBe(false)
  })

  it('returns false for a generic Error with no relevant message', () => {
    expect(isUniqueViolation(new Error('network timeout'))).toBe(false)
  })

  it('returns false for null', () => {
    expect(isUniqueViolation(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isUniqueViolation(undefined)).toBe(false)
  })

  it('returns false for a plain string', () => {
    expect(isUniqueViolation('23505')).toBe(false)
  })

  it('does not infinitely loop on circular cause references', () => {
    const err: { message: string; cause?: unknown } = { message: 'circular' }
    err.cause = err
    expect(() => isUniqueViolation(err)).not.toThrow()
    expect(isUniqueViolation(err)).toBe(false)
  })
})
