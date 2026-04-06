import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { requireAuth } from '@/lib/middleware'

// ─── PATCH /api/notifications/read — mark notifications as read ───────────────
// Body: { id: string } — marks one notification
// No body / no id — marks all unread notifications for the current user

export const PATCH = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const singleId = typeof body?.id === 'string' ? body.id : null

    const condition = singleId
      ? and(eq(notifications.id, singleId), eq(notifications.userId, user.sub))
      : and(eq(notifications.userId, user.sub), eq(notifications.isRead, false))

    await db.update(notifications).set({ isRead: true }).where(condition)

    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    console.error('[PATCH /api/notifications/read]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
