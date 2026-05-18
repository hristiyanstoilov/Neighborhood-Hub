import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { and, isNotNull, lt } from 'drizzle-orm'
import { requireAdmin, getClientIp } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { apiRatelimit } from '@/lib/ratelimit'

const PURGE_AFTER_DAYS = 30

// POST /api/admin/purge-deleted-users
// Hard-deletes soft-deleted users whose deletedAt is older than 30 days.
// All FK cascades handle related data — no manual child cleanup needed.
export const POST = requireAdmin(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - PURGE_AFTER_DAYS)

    const purged = await db
      .delete(users)
      .where(and(isNotNull(users.deletedAt), lt(users.deletedAt, cutoff)))
      .returning({ id: users.id })

    const ip = getClientIp(req)

    await writeAuditLog({
      userId: user.sub,
      userEmail: user.email,
      action: 'delete',
      entity: 'users',
      entityId: 'bulk',
      metadata: {
        purgedCount: purged.length,
        cutoffDate: cutoff.toISOString(),
        adminAction: 'gdpr_hard_purge',
      },
      ipAddress: ip,
    })

    console.info(
      `[admin/purge-deleted-users] user=${user.sub} purged ${purged.length} accounts deleted before ${cutoff.toISOString()}`
    )

    return NextResponse.json({
      data: { purgedCount: purged.length, cutoffDate: cutoff.toISOString() },
    })
  } catch (err) {
    console.error('[POST /api/admin/purge-deleted-users]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
