import { describe, expect, it } from 'vitest'
import { vi } from 'vitest'

vi.mock('@/db', () => ({
  db: {},
}))

import { computeLevel } from './badges'

describe('computeLevel', () => {
  it('returns level 1 for 0 points', () => {
    expect(computeLevel(0)).toBe(1)
  })

  it('returns level 1 for 9 points (just below threshold)', () => {
    expect(computeLevel(9)).toBe(1)
  })

  it('returns level 2 for 10 points (exactly at threshold)', () => {
    expect(computeLevel(10)).toBe(2)
  })

  it('returns level 2 for 29 points', () => {
    expect(computeLevel(29)).toBe(2)
  })

  it('returns level 3 for 30 points', () => {
    expect(computeLevel(30)).toBe(3)
  })

  it('returns level 3 for 59 points', () => {
    expect(computeLevel(59)).toBe(3)
  })

  it('returns level 4 for 60 points', () => {
    expect(computeLevel(60)).toBe(4)
  })

  it('returns level 4 for 99 points', () => {
    expect(computeLevel(99)).toBe(4)
  })

  it('returns level 5 for 100 points', () => {
    expect(computeLevel(100)).toBe(5)
  })

  it('returns level 5 for 199 points', () => {
    expect(computeLevel(199)).toBe(5)
  })

  it('returns level 6 for 200 points', () => {
    expect(computeLevel(200)).toBe(6)
  })

  it('returns level 6 for very large point totals', () => {
    expect(computeLevel(9999)).toBe(6)
  })
})
