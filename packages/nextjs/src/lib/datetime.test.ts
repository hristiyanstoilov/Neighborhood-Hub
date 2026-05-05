import { describe, it, expect } from 'vitest'
import { toDatetimeLocal } from './datetime'

describe('toDatetimeLocal', () => {
  it('returns empty string for null', () => {
    expect(toDatetimeLocal(null)).toBe('')
  })

  it('returns empty string for empty string', () => {
    expect(toDatetimeLocal('')).toBe('')
  })

  it('output matches the datetime-local input format YYYY-MM-DDTHH:MM', () => {
    const result = toDatetimeLocal('2026-06-15T11:00:00.000Z')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })

  it('uses local hours, not UTC hours', () => {
    // Build the expected value using the same local-time methods the function uses,
    // so the test passes in any timezone without hardcoding offsets.
    const iso = '2026-06-15T11:00:00.000Z'
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    const expected = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    expect(toDatetimeLocal(iso)).toBe(expected)
  })

  it('uses local date, not UTC date (catches midnight UTC boundary)', () => {
    // Midnight UTC is the previous calendar day in timezones west of UTC.
    // The function must not silently shift the date.
    const iso = '2026-06-15T00:00:00.000Z'
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    const expectedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    expect(toDatetimeLocal(iso).startsWith(expectedDate)).toBe(true)
  })

  it('pads single-digit month and day with leading zero', () => {
    // January 5 → 01-05, not 1-5
    const iso = '2026-01-05T08:03:00.000Z'
    const result = toDatetimeLocal(iso)
    // The pattern check covers padding; just verify format holds for small values.
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  })

  it('old UTC-slice bug is gone — result is NOT equal to iso.slice(0,16) in non-UTC zones', () => {
    // In UTC+3 or UTC-5 the local time differs from the UTC string.
    // If getTimezoneOffset() === 0 both would match — we skip the assertion in that case.
    const iso = '2026-06-15T11:30:00.000Z'
    const utcSlice = iso.slice(0, 16) // '2026-06-15T11:30'
    const localResult = toDatetimeLocal(iso)
    if (new Date().getTimezoneOffset() !== 0) {
      expect(localResult).not.toBe(utcSlice)
    }
    // In UTC, both are the same — function is still correct, just not distinguishable.
  })
})
