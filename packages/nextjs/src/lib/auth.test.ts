import { describe, it, expect } from 'vitest'
// JWT_SECRET is set in src/test-setup.ts (vitest setupFiles)
import { signAccessToken, verifyAccessToken, generateSecureToken, refreshTokenExpiresAt, verificationTokenExpiresAt, passwordResetTokenExpiresAt } from './auth'

describe('signAccessToken / verifyAccessToken', () => {
  const payload = { sub: 'user-123', email: 'test@example.com', role: 'user' as const }

  it('round-trips a payload', () => {
    const token = signAccessToken(payload)
    const decoded = verifyAccessToken(token)
    expect(decoded.sub).toBe(payload.sub)
    expect(decoded.email).toBe(payload.email)
    expect(decoded.role).toBe(payload.role)
  })

  it('throws on an invalid token', () => {
    expect(() => verifyAccessToken('not.a.token')).toThrow()
  })

  it('throws on a tampered token', () => {
    const token = signAccessToken(payload)
    const tampered = token.slice(0, -3) + 'xxx'
    expect(() => verifyAccessToken(tampered)).toThrow()
  })
})

describe('generateSecureToken', () => {
  it('returns a 64-char hex string', () => {
    const token = generateSecureToken()
    expect(token).toHaveLength(64)
    expect(token).toMatch(/^[0-9a-f]+$/)
  })

  it('returns unique tokens', () => {
    const a = generateSecureToken()
    const b = generateSecureToken()
    expect(a).not.toBe(b)
  })
})

describe('token expiry helpers', () => {
  it('refreshTokenExpiresAt returns ~7 days from now', () => {
    const now = Date.now()
    const expiry = refreshTokenExpiresAt().getTime()
    const diff = expiry - now
    expect(diff).toBeGreaterThan(6 * 24 * 60 * 60 * 1000)
    expect(diff).toBeLessThan(8 * 24 * 60 * 60 * 1000)
  })

  it('verificationTokenExpiresAt returns ~24 hours from now', () => {
    const now = Date.now()
    const expiry = verificationTokenExpiresAt().getTime()
    const diff = expiry - now
    expect(diff).toBeGreaterThan(23 * 60 * 60 * 1000)
    expect(diff).toBeLessThan(25 * 60 * 60 * 1000)
  })

  it('passwordResetTokenExpiresAt returns ~1 hour from now', () => {
    const now = Date.now()
    const expiry = passwordResetTokenExpiresAt().getTime()
    const diff = expiry - now
    expect(diff).toBeGreaterThan(59 * 60 * 1000)
    expect(diff).toBeLessThan(61 * 60 * 1000)
  })
})
