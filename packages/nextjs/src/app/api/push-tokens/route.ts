import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { pushTokens } from '@/db/schema'
import { eq, and, asc, inArray } from 'drizzle-orm'
import { requireAuth } from '@/lib/middleware'
import { apiRatelimit } from '@/lib/ratelimit'

const EXPO_TOKEN_RE = /^ExponentPushToken\[.+\]$/

// ─── POST /api/push-tokens — register or refresh a push token ────────────────

export const POST = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const token = typeof body?.token === 'string' ? body.token.trim() : ''
    const platform = typeof body?.platform === 'string' ? body.platform.toLowerCase().trim() : ''

    if (!token || !['ios', 'android'].includes(platform)) {
      return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
    }

    if (!EXPO_TOKEN_RE.test(token)) {
      return NextResponse.json({ error: 'INVALID_TOKEN_FORMAT' }, { status: 400 })
    }

    // Check if this token is already owned by a different user
    const existing = await db
      .select({ userId: pushTokens.userId })
      .from(pushTokens)
      .where(eq(pushTokens.token, token))
      .limit(1)

    if (existing.length > 0 && existing[0].userId !== user.sub) {
      // Token belongs to another user — refuse, don't re-assign ownership
      return NextResponse.json({ error: 'TOKEN_CONFLICT' }, { status: 409 })
    }

    // Cap at 10 tokens per user — delete oldest if at limit before inserting a new one
    if (existing.length === 0) {
      const userTokens = await db
        .select({ token: pushTokens.token })
        .from(pushTokens)
        .where(eq(pushTokens.userId, user.sub))
        .orderBy(asc(pushTokens.createdAt))

      if (userTokens.length >= 10) {
        const surplus = userTokens.slice(0, userTokens.length - 9).map((r) => r.token)
        await db.delete(pushTokens).where(and(eq(pushTokens.userId, user.sub), inArray(pushTokens.token, surplus)))
      }
    }

    // Safe to upsert — only update platform, never userId
    await db
      .insert(pushTokens)
      .values({ userId: user.sub, token, platform })
      .onConflictDoUpdate({
        target: pushTokens.token,
        set: { platform },
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
