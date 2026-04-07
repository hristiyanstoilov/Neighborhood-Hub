import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { refreshTokens } from '@/db/schema'
import { eq, and, lt } from 'drizzle-orm'
import { requireAuth, getClientIp } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'

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

    // Best-effort: delete old revoked tokens for this user (table hygiene)
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    db.delete(refreshTokens)
      .where(and(
        eq(refreshTokens.userId, user.sub),
        eq(refreshTokens.isRevoked, true),
        lt(refreshTokens.expiresAt, cutoff)
      ))
      .catch((err) => console.error('[logout] token cleanup failed:', err))

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
