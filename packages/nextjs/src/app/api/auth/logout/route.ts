import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { refreshTokens } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth, getClientIp } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { cleanupRefreshTokensForUser } from '@/lib/refresh-token-hygiene'

export const POST = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const rawRefreshToken = req.cookies.get('refresh_token')?.value

    if (rawRefreshToken) {
      await db
        .update(refreshTokens)
        .set({ isRevoked: true })
        .where(eq(refreshTokens.token, rawRefreshToken))
    }

    await writeAuditLog({
      userId: user.sub,
      userEmail: user.email,
      action: 'logout',
      entity: 'users',
      entityId: user.sub,
      ipAddress: getClientIp(req),
    })

    // Best-effort token hygiene for this user.
    await cleanupRefreshTokensForUser(user.sub).catch((err) => {
      console.error('[logout] token cleanup failed:', err)
    })

    const response = NextResponse.json({ data: { message: 'Logged out.' } })

    response.cookies.set('refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 0,
    })

    return response
  } catch (err) {
    console.error('[logout]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
