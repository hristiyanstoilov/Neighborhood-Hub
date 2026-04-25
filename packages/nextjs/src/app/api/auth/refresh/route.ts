import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { db } from '@/db'
import { users, refreshTokens } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import {
  signAccessToken,
  generateSecureToken,
  refreshTokenExpiresAt,
} from '@/lib/auth'
import { getClientIp } from '@/lib/middleware'
import { refreshRatelimit } from '@/lib/ratelimit'
import { cleanupRefreshTokensForUser } from '@/lib/refresh-token-hygiene'

function tokenFingerprint(token: string) {
  return createHash('sha256').update(token).digest('hex').slice(0, 16)
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)

    const cookieToken = req.cookies.get('refresh_token')?.value

    // Mobile clients send the token in the request body (can't use httpOnly cookies)
    let bodyToken: string | undefined
    const contentType = req.headers.get('content-type') ?? ''
    if (!cookieToken && contentType.includes('application/json')) {
      const body = await req.json().catch(() => ({}))
      bodyToken = typeof body?.refreshToken === 'string' ? body.refreshToken : undefined
    }

    const rawRefreshToken = cookieToken ?? bodyToken
    const isMobileRequest = !cookieToken && !!bodyToken

    // Reject missing token before hitting Redis — keeps the smoke check clean and
    // avoids a Redis round-trip for requests that will 401 anyway.
    if (!rawRefreshToken) {
      return NextResponse.json({ error: 'MISSING_REFRESH_TOKEN' }, { status: 401 })
    }

    const { success } = await refreshRatelimit.limit(`${ip}:${tokenFingerprint(rawRefreshToken)}`)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const stored = await db.query.refreshTokens.findFirst({
      where: and(
        eq(refreshTokens.token, rawRefreshToken),
        eq(refreshTokens.isRevoked, false)
      ),
    })

    if (!stored || stored.expiresAt < new Date()) {
      return NextResponse.json({ error: 'INVALID_REFRESH_TOKEN' }, { status: 401 })
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, stored.userId) })

    if (!user || user.deletedAt) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 401 })
    }

    // Best-effort token hygiene for the current user.
    await cleanupRefreshTokensForUser(user.id).catch((err) => {
      console.error('[refresh] token cleanup failed:', err)
    })

    const newRawToken = generateSecureToken()
    const expiresAt = refreshTokenExpiresAt()

    // neon-http does not support transactions.
    // Rotate with sequential writes and a best-effort compensation on failure.
    const revoked = await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(and(eq(refreshTokens.id, stored.id), eq(refreshTokens.isRevoked, false)))
      .returning({ id: refreshTokens.id })

    if (revoked.length === 0) {
      return NextResponse.json({ error: 'INVALID_REFRESH_TOKEN' }, { status: 401 })
    }

    try {
      await db.insert(refreshTokens).values({
        userId: user.id,
        token: newRawToken,
        expiresAt,
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') ?? undefined,
      })
    } catch (insertErr) {
      await db
        .update(refreshTokens)
        .set({ isRevoked: false })
        .where(eq(refreshTokens.id, stored.id))
      throw insertErr
    }

    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role })

    // Mobile: return new refresh token in body; Web: set httpOnly cookie
    const response = NextResponse.json({
      data: isMobileRequest
        ? { accessToken, refreshToken: newRawToken }
        : { accessToken },
    })

    response.cookies.set('refresh_token', newRawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (err) {
    console.error('[refresh]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
