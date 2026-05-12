import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { requireAuthWithRateLimit } from '@/lib/middleware'

// ─── GET /api/notifications — list notifications for current user ─────────────

export const GET = requireAuthWithRateLimit(async (req: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get('unread') === 'true'

    const conditions = [eq(notifications.userId, user.sub)]
    if (unreadOnly) conditions.push(eq(notifications.isRead, false))

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
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(100)

    return NextResponse.json({ data: rows })
  } catch (err) {
    console.error('[GET /api/notifications]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
