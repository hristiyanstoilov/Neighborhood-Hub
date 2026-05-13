import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { requireAuthWithRateLimit } from '@/lib/middleware'

export const POST = requireAuthWithRateLimit(async (_req: NextRequest, { user }) => {
  try {
    const rows = await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, user.sub), eq(notifications.isRead, false)))
      .returning({ id: notifications.id })

    return NextResponse.json({ data: { updated: rows.length } }, { status: 200 })
  } catch (err) {
    console.error('[POST /api/notifications/read-all]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})