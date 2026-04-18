import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { refreshTokens } from '@/db/schema'
import { and, eq, lt } from 'drizzle-orm'
import { requireAuth, getClientIp } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'

export const POST = requireAuth(async (req: NextRequest, { user }) => {
  try {
    // Web clients send refresh token as an httpOnly cookie.
    // Mobile clients cannot use httpOnly cookies, so they send it in the JSON body.
    const cookieToken = req.cookies.get('refresh_token')?.value

    let bodyToken: string | undefined
    if (!cookieToken) {
      const contentType = req.headers.get('content-type') ?? ''
      if (contentType.includes('application/json')) {
        const body = await req.json().catch(() => ({}))
        bodyToken = typeof body?.refreshToken === 'string' ? body.refreshToken : undefined
      }
    }

    const rawRefreshToken = cookieToken ?? bodyToken

    if (rawRefreshToken) {
      await db
        .update(refreshTokens)
        .set({ isRevoked: true })
        .where(eq(refreshTokens.token, rawRefreshToken))
    }

    db
      .delete(refreshTokens)
      .where(
        and(
          eq(refreshTokens.userId, user.sub),
          eq(refreshTokens.isRevoked, true),
          lt(refreshTokens.expiresAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        )
      )
      .catch(() => {})

    await writeAuditLog({
      userId: user.sub,
      userEmail: user.email,
      action: 'logout',
      entity: 'users',
      entityId: user.sub,
      ipAddress: getClientIp(req),
    })

    const response = NextResponse.json({ data: { message: 'Logged out.' } })

    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })

    return response
  } catch (err) {
    console.error('[logout]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
