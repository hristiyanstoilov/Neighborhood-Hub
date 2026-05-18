import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { reports, users, profiles, skills, tools, foodShares, events, eventAttendees, communityDrives, drivePledges, messages } from '@/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { requireAdmin, getClientIp } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { apiRatelimit } from '@/lib/ratelimit'
import { createNotification } from '@/lib/create-notification'
import { z } from 'zod'

const filterSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'dismissed']).optional(),
})

export const GET = requireAdmin(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const params = Object.fromEntries(new URL(req.url).searchParams)
    const parsed = filterSchema.safeParse(params)
    if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
    const { status } = parsed.data

    const rows = await db
      .select({
        id:           reports.id,
        targetType:   reports.targetType,
        targetId:     reports.targetId,
        reason:       reports.reason,
        details:      reports.details,
        status:       reports.status,
        reviewedAt:   reports.reviewedAt,
        createdAt:    reports.createdAt,
        reporterName: profiles.name,
        reporterEmail: users.email,
      })
      .from(reports)
      .leftJoin(users, eq(users.id, reports.reporterId))
      .leftJoin(profiles, eq(profiles.userId, reports.reporterId))
      .where(status ? eq(reports.status, status) : undefined)
      .orderBy(desc(reports.createdAt))
      .limit(200)

    return NextResponse.json({ data: rows })
  } catch (err) {
    console.error('[GET /api/admin/reports]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

const patchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('set_status'), id: z.string().uuid(), status: z.enum(['reviewed', 'dismissed']) }),
  z.object({ action: z.literal('unpublish'),  id: z.string().uuid() }),
])

export const PATCH = requireAdmin(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const ip = getClientIp(req)
    const body = await req.json().catch(() => null)
    if (body === null) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

    const { action, id } = parsed.data

    if (action === 'set_status') {
      const { status } = parsed.data
      const [updated] = await db
        .update(reports)
        .set({ status, reviewedById: user.sub, reviewedAt: new Date() })
        .where(eq(reports.id, id))
        .returning({ id: reports.id })

      if (!updated) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

      await writeAuditLog({
        userId:    user.sub,
        userEmail: user.email,
        action:    'update',
        entity:    'reports',
        entityId:  id,
        metadata:  { newStatus: status },
        ipAddress: ip ?? undefined,
      })

      return NextResponse.json({ data: { ok: true } })
    }

    // action === 'unpublish' — remove the reported content, then mark report reviewed
    const [report] = await db
      .select({ id: reports.id, targetType: reports.targetType, targetId: reports.targetId })
      .from(reports)
      .where(eq(reports.id, id))
      .limit(1)

    if (!report) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    const { targetType, targetId } = report
    const now = new Date()

    switch (targetType) {
      case 'skill':
        await db.update(skills).set({ status: 'retired', deletedAt: now }).where(eq(skills.id, targetId))
        break
      case 'tool':
        await db.update(tools).set({ deletedAt: now, updatedAt: now }).where(eq(tools.id, targetId))
        break
      case 'food':
        await db.update(foodShares).set({ deletedAt: now, updatedAt: now }).where(eq(foodShares.id, targetId))
        break
      case 'event': {
        await db.update(events).set({ status: 'cancelled', updatedAt: now }).where(eq(events.id, targetId))
        const attendees = await db
          .select({ userId: eventAttendees.userId })
          .from(eventAttendees)
          .where(and(eq(eventAttendees.eventId, targetId), eq(eventAttendees.status, 'attending')))
        for (const attendee of attendees) {
          void createNotification({
            userId: attendee.userId,
            type: 'event_cancelled',
            entityType: 'event',
            entityId: targetId,
          }).catch((e) => console.error('[side-effect]', e))
        }
        break
      }
      case 'drive': {
        await db.update(communityDrives).set({ status: 'cancelled', updatedAt: now }).where(eq(communityDrives.id, targetId))
        const pledgers = await db
          .select({ userId: drivePledges.userId })
          .from(drivePledges)
          .where(and(eq(drivePledges.driveId, targetId), eq(drivePledges.status, 'pledged')))
        for (const pledger of pledgers) {
          void createNotification({
            userId: pledger.userId,
            type: 'drive_cancelled',
            entityType: 'community_drive',
            entityId: targetId,
          }).catch((e) => console.error('[side-effect]', e))
        }
        break
      }
      case 'user':
        // Effective ban — lock until far future
        await db.update(users).set({ lockedUntil: new Date('2099-01-01') }).where(eq(users.id, targetId))
        break
      case 'message':
        await db.update(messages).set({ body: '[removed by admin]' }).where(eq(messages.id, targetId))
        break
      default:
        return NextResponse.json({ error: 'UNSUPPORTED_TARGET_TYPE' }, { status: 422 })
    }

    await db
      .update(reports)
      .set({ status: 'reviewed', reviewedById: user.sub, reviewedAt: now })
      .where(eq(reports.id, id))

    await writeAuditLog({
      userId:    user.sub,
      userEmail: user.email,
      action:    'delete',
      entity:    targetType,
      entityId:  targetId,
      metadata:  { via: 'admin_report_unpublish', reportId: id },
      ipAddress: ip ?? undefined,
    })

    return NextResponse.json({ data: { ok: true, unpublished: targetType } })
  } catch (err) {
    console.error('[PATCH /api/admin/reports]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
