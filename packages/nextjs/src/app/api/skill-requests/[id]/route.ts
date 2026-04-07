import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { skillRequests, notifications, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireAuth } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { patchSkillRequestSchema } from '@/lib/schemas/skill-request'
import { uuidSchema } from '@/lib/schemas/skill'

const TERMINAL_STATUSES = ['rejected', 'completed', 'cancelled']

// ─── PATCH /api/skill-requests/[id] — status transition ─────────────────────

export const PATCH = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').at(-1)!
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const parsed = patchSkillRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const [existing, dbUser] = await Promise.all([
      db.query.skillRequests.findFirst({ where: eq(skillRequests.id, id) }),
      db.query.users.findFirst({ where: eq(users.id, user.sub) }),
    ])
    if (!existing) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }
    if (!dbUser || dbUser.deletedAt) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    // Access control — caller must be requester or owner
    const isOwner = existing.userToId === user.sub
    const isRequester = existing.userFromId === user.sub
    if (!isOwner && !isRequester) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    // Terminal state check
    if (TERMINAL_STATUSES.includes(existing.status)) {
      return NextResponse.json({ error: 'REQUEST_ALREADY_TERMINAL' }, { status: 422 })
    }

    const { action, cancellationReason } = parsed.data
    const now = new Date()

    // Enforce state machine + role rules
    if (action === 'accept' || action === 'reject') {
      if (!isOwner) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
      }
      if (existing.status !== 'pending') {
        return NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 422 })
      }
    }

    if (action === 'complete') {
      if (existing.status !== 'accepted') {
        return NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 422 })
      }
    }

    if (action === 'cancel') {
      if (!['pending', 'accepted'].includes(existing.status)) {
        return NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 422 })
      }
    }

    // Map action to new values
    const updates: Partial<typeof skillRequests.$inferInsert> & { updatedAt: Date } = {
      updatedAt: now,
    }

    let notificationType: string
    let notificationRecipient: string

    if (action === 'accept') {
      updates.status = 'accepted'
      notificationType = 'request_accepted'
      notificationRecipient = existing.userFromId
    } else if (action === 'reject') {
      updates.status = 'rejected'
      notificationType = 'request_rejected'
      notificationRecipient = existing.userFromId
    } else if (action === 'complete') {
      updates.status = 'completed'
      updates.completedAt = now
      notificationType = 'request_completed'
      // Notify the other party
      notificationRecipient = isOwner ? existing.userFromId : existing.userToId
    } else {
      // cancel
      updates.status = 'cancelled'
      updates.cancellationReason = cancellationReason ?? null
      updates.cancelledById = user.sub
      notificationType = 'request_cancelled'
      notificationRecipient = isOwner ? existing.userFromId : existing.userToId
    }

    const [updated] = await db
      .update(skillRequests)
      .set(updates)
      .where(eq(skillRequests.id, id))
      .returning()

    // Notify the other party — fire and forget
    db.insert(notifications)
      .values({
        userId: notificationRecipient,
        type: notificationType,
        entityType: 'skill_request',
        entityId: id,
      })
      .catch(() => {})

    await writeAuditLog({
      userId: user.sub,
      userEmail: user.email,
      action: 'update',
      entity: 'skill_requests',
      entityId: id,
      ipAddress: ip,
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PATCH /api/skill-requests/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
