import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { pushTokens } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/middleware'
import { apiRatelimit } from '@/lib/ratelimit'

// ─── POST /api/push-tokens — register or refresh a push token ────────────────

export const POST = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const token = typeof body?.token === 'string' ? body.token.trim() : ''
    const platform = typeof body?.platform === 'string' ? body.platform.trim() : ''

    if (!token || !['ios', 'android'].includes(platform)) {
      return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
    }

    // Upsert by token value — token may rotate (e.g. re-install)
    await db
      .insert(pushTokens)
      .values({ userId: user.sub, token, platform })
      .onConflictDoUpdate({
        target: pushTokens.token,
        set: { userId: user.sub },
      })

    return NextResponse.json({ data: { ok: true } }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/push-tokens]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

// ─── DELETE /api/push-tokens — remove token on logout ────────────────────────

export const DELETE = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json().catch(() => null)
    const token = typeof body?.token === 'string' ? body.token.trim() : ''

    if (!token) {
      return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
    }

    await db
      .delete(pushTokens)
      .where(and(eq(pushTokens.userId, user.sub), eq(pushTokens.token, token)))

    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    console.error('[DELETE /api/push-tokens]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
