import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, refreshTokens } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import {
  signAccessToken,
  generateSecureToken,
  refreshTokenExpiresAt,
} from '@/lib/auth'
import { getClientIp } from '@/lib/middleware'
import { loginRatelimit } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const { success } = await loginRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const rawRefreshToken = req.cookies.get('refresh_token')?.value

    if (!rawRefreshToken) {
      return NextResponse.json({ error: 'MISSING_REFRESH_TOKEN' }, { status: 401 })
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

    const newRawToken = generateSecureToken()
    const expiresAt = refreshTokenExpiresAt()

    // Rotate — revoke old + insert new in one transaction
    await db.transaction(async (tx) => {
      await tx
        .update(refreshTokens)
        .set({ isRevoked: true })
        .where(eq(refreshTokens.id, stored.id))

      await tx.insert(refreshTokens).values({
        userId: user.id,
        token: newRawToken,
        expiresAt,
        ipAddress: ip,
        userAgent: req.headers.get('user-agent') ?? undefined,
      })
    })

    const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role })

    const response = NextResponse.json({ data: { accessToken } })

    response.cookies.set('refresh_token', newRawToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (err) {
    console.error('[refresh]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
