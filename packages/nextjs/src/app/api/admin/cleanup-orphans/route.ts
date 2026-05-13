import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { notifications, skillRequests, toolReservations, foodReservations, events } from '@/db/schema'
import { notInArray, isNotNull, inArray, sql } from 'drizzle-orm'
import { requireAdmin, getClientIp } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'

// POST /api/admin/cleanup-orphans — delete notifications referencing missing entities
export const POST = requireAdmin(async (req: NextRequest, { user }) => {
  try {
    // 1. get distinct entity types that have a non-null entityId
    const rows = await db
      .select({ entityType: notifications.entityType })
      .from(notifications)
      .where(isNotNull(notifications.entityId))
      .groupBy(notifications.entityType)

    const types = rows.map((r) => r.entityType)

    let totalDeleted = 0

    // skill_request
    if (types.includes('skill_request')) {
      const live = await db.select({ id: skillRequests.id }).from(skillRequests)
      const liveIds = live.map((r) => r.id)
      let deleted = [] as { id: string }[]
      if (liveIds.length > 0) {
        deleted = await db
          .delete(notifications)
          .where(sql`${notifications.entityType} = 'skill_request' AND ${notInArray(notifications.entityId, liveIds)}`)
          .returning({ id: notifications.id })
      } else {
        deleted = await db.delete(notifications).where(sql`${notifications.entityType} = 'skill_request'`).returning({ id: notifications.id })
      }
      totalDeleted += deleted.length
    }

    // tool_reservation
    if (types.includes('tool_reservation')) {
      const live = await db.select({ id: toolReservations.id }).from(toolReservations)
      const liveIds = live.map((r) => r.id)
      let deleted = [] as { id: string }[]
      if (liveIds.length > 0) {
        deleted = await db
          .delete(notifications)
          .where(sql`${notifications.entityType} = 'tool_reservation' AND ${notInArray(notifications.entityId, liveIds)}`)
          .returning({ id: notifications.id })
      } else {
        deleted = await db.delete(notifications).where(sql`${notifications.entityType} = 'tool_reservation'`).returning({ id: notifications.id })
      }
      totalDeleted += deleted.length
    }

    // food_reservation
    if (types.includes('food_reservation')) {
      const live = await db.select({ id: foodReservations.id }).from(foodReservations)
      const liveIds = live.map((r) => r.id)
      let deleted = [] as { id: string }[]
      if (liveIds.length > 0) {
        deleted = await db
          .delete(notifications)
          .where(sql`${notifications.entityType} = 'food_reservation' AND ${notInArray(notifications.entityId, liveIds)}`)
          .returning({ id: notifications.id })
      } else {
        deleted = await db.delete(notifications).where(sql`${notifications.entityType} = 'food_reservation'`).returning({ id: notifications.id })
      }
      totalDeleted += deleted.length
    }

    // event
    if (types.includes('event')) {
      const live = await db.select({ id: events.id }).from(events)
      const liveIds = live.map((r) => r.id)
      let deleted = [] as { id: string }[]
      if (liveIds.length > 0) {
        deleted = await db
          .delete(notifications)
          .where(sql`${notifications.entityType} = 'event' AND ${notInArray(notifications.entityId, liveIds)}`)
          .returning({ id: notifications.id })
      } else {
        deleted = await db.delete(notifications).where(sql`${notifications.entityType} = 'event'`).returning({ id: notifications.id })
      }
      totalDeleted += deleted.length
    }

    const ip = getClientIp(req)
    await writeAuditLog({
      userId: user.sub,
      userEmail: user.email,
      action: 'delete',
      entity: 'notifications',
      entityId: 'batch',
      metadata: { deleted: totalDeleted, reason: 'orphan_cleanup' },
      ipAddress: ip ?? undefined,
    })

    console.info(`[admin/cleanup-orphans] user=${user.sub} deleted ${totalDeleted} orphaned notifications`)

    return NextResponse.json({ data: { deleted: totalDeleted } })
  } catch (err) {
    console.error('[POST /api/admin/cleanup-orphans]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
