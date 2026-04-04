import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const ACCESS_SECRET = process.env.JWT_SECRET!

export interface JwtPayload {
  sub: string   // user id
  email: string
  role: 'user' | 'admin'
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' })
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload
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
