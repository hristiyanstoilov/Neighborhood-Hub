import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { notifications } from '@/db/schema'
import { and, eq, lt } from 'drizzle-orm'
import { requireAdmin } from '@/lib/middleware'

const RETENTION_DAYS = 90

// ─── POST /api/admin/cleanup — purge old read notifications ─────────────────

export const POST = requireAdmin(async (_req: NextRequest, { user }) => {
  try {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS)

    const deleted = await db
      .delete(notifications)
      .where(and(eq(notifications.isRead, true), lt(notifications.createdAt, cutoff)))
      .returning({ id: notifications.id })

    console.info(`[admin/cleanup] user=${user.sub} purged ${deleted.length} notifications older than ${RETENTION_DAYS} days`)

    return NextResponse.json({ data: { deleted: deleted.length, cutoffDate: cutoff.toISOString() } })
  } catch (err) {
    console.error('[POST /api/admin/cleanup]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
