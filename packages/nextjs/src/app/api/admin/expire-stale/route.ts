import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { skillRequests, toolReservations, foodReservations } from '@/db/schema'
import { and, eq, lt } from 'drizzle-orm'
import { requireAdmin, getClientIp } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { apiRatelimit } from '@/lib/ratelimit'
import { createNotification } from '@/lib/create-notification'

const SKILL_REQUEST_TTL_DAYS    = 30
const TOOL_RESERVATION_TTL_DAYS = 14
const FOOD_RESERVATION_TTL_DAYS = 7

// POST /api/admin/expire-stale — auto-cancel/reject pending requests older than TTL
export const POST = requireAdmin(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const now = new Date()

    const skillCutoff = new Date(now)
    skillCutoff.setDate(skillCutoff.getDate() - SKILL_REQUEST_TTL_DAYS)

    const toolCutoff = new Date(now)
    toolCutoff.setDate(toolCutoff.getDate() - TOOL_RESERVATION_TTL_DAYS)

    const foodCutoff = new Date(now)
    foodCutoff.setDate(foodCutoff.getDate() - FOOD_RESERVATION_TTL_DAYS)

    const [expiredSkills, expiredTools, expiredFood] = await Promise.all([
      db
        .update(skillRequests)
        .set({ status: 'cancelled', updatedAt: now })
        .where(and(eq(skillRequests.status, 'pending'), lt(skillRequests.createdAt, skillCutoff)))
        .returning({ id: skillRequests.id, userFromId: skillRequests.userFromId }),
      db
        .update(toolReservations)
        .set({ status: 'cancelled', updatedAt: now })
        .where(and(eq(toolReservations.status, 'pending'), lt(toolReservations.createdAt, toolCutoff)))
        .returning({ id: toolReservations.id, borrowerId: toolReservations.borrowerId, ownerId: toolReservations.ownerId }),
      db
        .update(foodReservations)
        .set({ status: 'cancelled', updatedAt: now })
        .where(and(eq(foodReservations.status, 'pending'), lt(foodReservations.createdAt, foodCutoff)))
        .returning({ id: foodReservations.id, requesterId: foodReservations.requesterId, ownerId: foodReservations.ownerId }),
    ])

    await writeAuditLog({
      userId:    user.sub,
      userEmail: user.email,
      action:    'update',
      entity:    'stale_requests',
      entityId:  'batch',
      metadata: {
        expiredSkillRequests:    expiredSkills.length,
        expiredToolReservations: expiredTools.length,
        expiredFoodReservations: expiredFood.length,
        skillCutoffDays: SKILL_REQUEST_TTL_DAYS,
        toolCutoffDays:  TOOL_RESERVATION_TTL_DAYS,
        foodCutoffDays:  FOOD_RESERVATION_TTL_DAYS,
      },
      ipAddress: ip ?? undefined,
    })

    // Fire-and-forget notifications — expired users must know why their request vanished
    for (const { id, userFromId } of expiredSkills) {
      // request_cancelled, not request_rejected — timeout ≠ active owner decline
      void createNotification({ userId: userFromId, type: 'request_cancelled', entityType: 'skill_request', entityId: id })
        .catch((e) => console.error('[side-effect]', e))
    }
    for (const { id, borrowerId, ownerId } of expiredTools) {
      void createNotification({ userId: borrowerId, type: 'reservation_cancelled', entityType: 'tool_reservation', entityId: id })
        .catch((e) => console.error('[side-effect]', e))
      void createNotification({ userId: ownerId, type: 'reservation_cancelled', entityType: 'tool_reservation', entityId: id })
        .catch((e) => console.error('[side-effect]', e))
    }
    for (const { id, requesterId, ownerId } of expiredFood) {
      void createNotification({ userId: requesterId, type: 'food_reservation_cancelled', entityType: 'food_reservation', entityId: id })
        .catch((e) => console.error('[side-effect]', e))
      void createNotification({ userId: ownerId, type: 'food_reservation_cancelled', entityType: 'food_reservation', entityId: id })
        .catch((e) => console.error('[side-effect]', e))
    }

    console.info(
      `[admin/expire-stale] user=${user.sub} expired ${expiredSkills.length} skill requests, ${expiredTools.length} tool reservations, ${expiredFood.length} food reservations`
    )

    return NextResponse.json({
      data: {
        expiredSkillRequests:    expiredSkills.length,
        expiredToolReservations: expiredTools.length,
        expiredFoodReservations: expiredFood.length,
      },
    })
  } catch (err) {
    console.error('[POST /api/admin/expire-stale]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
