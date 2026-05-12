import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { skillRequests, users, skills } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { getClientIp, requireAuthWithRateLimit } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { awardPoints, checkAndAwardBadges } from '@/lib/badges'
import { SKILL_COMPLETE_POINTS } from '@/lib/constants'
import { SkillRequestStatus } from '@/lib/constants/statuses'
import { patchSkillRequestSchema } from '@/lib/schemas/skill-request'
import { uuidSchema } from '@/lib/schemas/skill'
import { createNotification } from '@/lib/create-notification'
import { sendSkillRequestAccepted } from '@/lib/email'

const TERMINAL_STATUSES: readonly string[] = [
  SkillRequestStatus.REJECTED,
  SkillRequestStatus.COMPLETED,
  SkillRequestStatus.CANCELLED,
] as const
const CANCELLABLE_STATUSES: readonly string[] = [SkillRequestStatus.PENDING, SkillRequestStatus.ACCEPTED] as const

// ─── PATCH /api/skill-requests/[id] — status transition ─────────────────────

export const PATCH = requireAuthWithRateLimit(async (req: NextRequest, { user, params }) => {
  try {
    const id = params.id
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const ip = getClientIp(req)

    const body = await req.json().catch(() => null)
    if (body === null) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
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
      if (existing.status !== SkillRequestStatus.PENDING) {
        return NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 422 })
      }
    }

    if (action === 'complete') {
      if (!isRequester) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
      }
      if (existing.status !== SkillRequestStatus.ACCEPTED) {
        return NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 422 })
      }
    }

    if (action === 'cancel') {
      if (!CANCELLABLE_STATUSES.includes(existing.status)) {
        return NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 422 })
      }

      if (existing.status === SkillRequestStatus.PENDING && !isRequester) {
        return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
      }
    }

    // Map action to new values
    const updates: Partial<typeof skillRequests.$inferInsert> & { updatedAt: Date } = {
      updatedAt: now,
    }

    let notificationType: string
    let notificationRecipient: string

    if (action === 'accept') {
      updates.status = SkillRequestStatus.ACCEPTED
      notificationType = 'request_accepted'
      notificationRecipient = existing.userFromId
    } else if (action === 'reject') {
      updates.status = SkillRequestStatus.REJECTED
      notificationType = 'request_rejected'
      notificationRecipient = existing.userFromId
    } else if (action === 'complete') {
      updates.status = SkillRequestStatus.COMPLETED
      updates.completedAt = now
      notificationType = 'request_completed'
      // Notify the other party
      notificationRecipient = existing.userToId
    } else {
      // cancel
      updates.status = SkillRequestStatus.CANCELLED
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
    void createNotification({
      userId: notificationRecipient,
      type: notificationType,
      entityType: 'skill_request',
      entityId: id,
    }).catch(() => {})

    // Send email notifications for key transitions
    if (updates.status === SkillRequestStatus.ACCEPTED) {
      const [requesterUser, skill] = await Promise.all([
        db.query.users.findFirst({
          where: eq(users.id, existing.userFromId),
          columns: { email: true },
        }),
        db.query.skills.findFirst({
          where: eq(skills.id, existing.skillId),
          columns: { title: true },
        }),
      ])
      if (requesterUser && skill) {
        void sendSkillRequestAccepted({
          to: requesterUser.email,
          skillTitle: skill.title ?? 'skill',
          scheduledStart: existing.scheduledStart,
        }).catch(() => {})
      }
    }

    let pointsAwarded = 0
    if (action === 'complete') {
      try {
        await Promise.all([
          awardPoints(existing.userFromId, SKILL_COMPLETE_POINTS),
          awardPoints(existing.userToId, SKILL_COMPLETE_POINTS),
        ])
        await Promise.all([
          checkAndAwardBadges(existing.userFromId),
          checkAndAwardBadges(existing.userToId),
        ])
        pointsAwarded = SKILL_COMPLETE_POINTS
      } catch (err) {
        console.error('[skill-requests complete] points/badges award failed', err)
      }
    }

    await writeAuditLog({
      userId: user.sub,
      userEmail: user.email,
      action: 'update',
      entity: 'skill_requests',
      entityId: id,
      ipAddress: ip,
    })

    return NextResponse.json({ data: updated, pointsAwarded: pointsAwarded > 0 ? pointsAwarded : undefined })
  } catch (err) {
    console.error('[PATCH /api/skill-requests/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
