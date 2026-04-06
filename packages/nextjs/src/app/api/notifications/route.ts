import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { requireAuth } from '@/lib/middleware'

// ─── GET /api/notifications — list unread notifications for current user ──────

export const GET = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const rows = await db
      .select({
        id:         notifications.id,
        type:       notifications.type,
        entityType: notifications.entityType,
        entityId:   notifications.entityId,
        isRead:     notifications.isRead,
        createdAt:  notifications.createdAt,
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, user.sub),
          eq(notifications.isRead, false)
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(20)

    return NextResponse.json({ data: rows })
  } catch (err) {
    console.error('[GET /api/notifications]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
