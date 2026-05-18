import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { communityDrives, drivePledges, users } from '@/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { getClientIp, requireAuthWithRateLimit } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { updatePledgeSchema } from '@/lib/schemas/drive'
import { createNotification } from '@/lib/create-notification'
import { sendDrivePledgeFulfilled } from '@/lib/email'

// ─── PATCH /api/drives/[id]/pledges/[pledgeId] ──────────────────────────────
// Organizer: mark fulfilled
// Pledger:   cancel

export const PATCH = requireAuthWithRateLimit(async (req: NextRequest, { user, params }) => {
  try {
    const ip = getClientIp(req)

    const driveId = params.id
    const pledgeId = params.pledgeId

    const drive = await db.query.communityDrives.findFirst({
      where: and(eq(communityDrives.id, driveId), isNull(communityDrives.deletedAt)),
    })
    if (!drive) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    const pledge = await db.query.drivePledges.findFirst({
      where: and(eq(drivePledges.id, pledgeId), eq(drivePledges.driveId, driveId)),
    })
    if (!pledge) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    const body = await req.json().catch(() => null)
    if (body === null) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
    const parsed = updatePledgeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { status } = parsed.data
    const isOrganizer = drive.organizerId === user.sub
    const isPledger   = pledge.userId === user.sub

    if (status === 'fulfilled' && !isOrganizer) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }
    if (status === 'cancelled' && !isPledger) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    if (pledge.status !== 'pledged') {
      return NextResponse.json({ error: 'INVALID_STATUS_TRANSITION' }, { status: 422 })
    }

    const [updated] = await db
      .update(drivePledges)
      .set({ status, updatedAt: new Date() })
      .where(eq(drivePledges.id, pledgeId))
      .returning()

    if (status === 'fulfilled') {
      void createNotification({
        userId: pledge.userId,
        type: 'drive_pledge_fulfilled',
        entityType: 'community_drive',
        entityId: driveId,
      }).catch((e) => console.error('[side-effect]', e))

      const pledgerUser = await db.query.users.findFirst({
        where: eq(users.id, pledge.userId),
        columns: { email: true },
      })
      if (pledgerUser) {
        void sendDrivePledgeFulfilled({
          to: pledgerUser.email,
          driveTitle: drive.title,
        }).catch((e) => console.error('[side-effect]', e))
      }
    }

    if (status === 'cancelled') {
      void createNotification({
        userId: drive.organizerId,
        type: 'drive_pledge_cancelled',
        entityType: 'community_drive',
        entityId: driveId,
      }).catch((e) => console.error('[side-effect]', e))
    }

    await writeAuditLog({
      userId:    user.sub,
      userEmail: user.email,
      action:    'update',
      entity:    'drive_pledges',
      entityId:  pledgeId,
      ipAddress: ip,
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PATCH /api/drives/[id]/pledges/[pledgeId]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
