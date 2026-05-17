import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { notifications, skillRequests, toolReservations, foodReservations, events } from '@/db/schema'
import { and, eq, isNotNull, notInArray } from 'drizzle-orm'
import { requireAdmin, getClientIp } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { apiRatelimit } from '@/lib/ratelimit'

const ENTITY_TABLE_MAP = {
  skill_request:    () => db.select({ id: skillRequests.id }).from(skillRequests),
  tool_reservation: () => db.select({ id: toolReservations.id }).from(toolReservations),
  food_reservation: () => db.select({ id: foodReservations.id }).from(foodReservations),
  event:            () => db.select({ id: events.id }).from(events),
} as const

type EntityType = keyof typeof ENTITY_TABLE_MAP

// ─── POST /api/admin/cleanup-orphans ────────────────────────────────────────

export const POST = requireAdmin(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const typesResult = await db
      .selectDistinct({ entityType: notifications.entityType })
      .from(notifications)
      .where(isNotNull(notifications.entityId))

    let totalDeleted = 0

    for (const { entityType } of typesResult) {
      if (!(entityType in ENTITY_TABLE_MAP)) continue

      const liveRows = await ENTITY_TABLE_MAP[entityType as EntityType]()
      const liveIds = liveRows.map((r) => r.id)

      if (liveIds.length === 0) {
        // Every notification for this type is orphaned
        const deleted = await db
          .delete(notifications)
          .where(and(eq(notifications.entityType, entityType), isNotNull(notifications.entityId)))
          .returning({ id: notifications.id })
        totalDeleted += deleted.length
      } else {
        // notInArray is safe: liveIds.length > 0 is guaranteed here
        const deleted = await db
          .delete(notifications)
          .where(and(
            eq(notifications.entityType, entityType),
            isNotNull(notifications.entityId),
            notInArray(notifications.entityId, liveIds),
          ))
          .returning({ id: notifications.id })
        totalDeleted += deleted.length
      }
    }

    await writeAuditLog({
      userId:    user.sub,
      userEmail: user.email,
      action:    'delete',
      entity:    'notifications',
      metadata:  { reason: 'orphan_cleanup', deleted: totalDeleted },
      ipAddress: ip,
    })

    console.info(`[admin/cleanup-orphans] user=${user.sub} deleted ${totalDeleted} orphaned notifications`)

    return NextResponse.json({ data: { deleted: totalDeleted } })
  } catch (err) {
    console.error('[POST /api/admin/cleanup-orphans]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
