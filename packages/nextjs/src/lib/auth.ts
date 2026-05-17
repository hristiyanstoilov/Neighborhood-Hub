import jwt from 'jsonwebtoken'
import crypto from 'crypto'

export interface JwtPayload {
  sub: string   // user id
  email: string
  role: 'user' | 'admin'
}

function getSecret(): string {
  const s = process.env.JWT_SECRET
  if (!s || s.length < 32) throw new Error('JWT_SECRET env var must be at least 32 characters')
  return s
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '15m' })
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as JwtPayload
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function refreshTokenExpiresAt(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d
}

export function verificationTokenExpiresAt(): Date {
  const d = new Date()
  d.setHours(d.getHours() + 24)
  return d
}

export function passwordResetTokenExpiresAt(): Date {
  const d = new Date()
  d.setHours(d.getHours() + 1)
  return d
}
