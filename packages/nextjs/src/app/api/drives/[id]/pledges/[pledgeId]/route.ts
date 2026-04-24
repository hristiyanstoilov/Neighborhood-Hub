import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { communityDrives, drivePledges, notifications } from '@/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireAuth } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { updatePledgeSchema } from '@/lib/schemas/drive'

// URL: /api/drives/[id]/pledges/[pledgeId]
// parts: ['api', 'drives', '{id}', 'pledges', '{pledgeId}']
function extractIds(url: string): { driveId: string; pledgeId: string } {
  const parts = new URL(url).pathname.split('/').filter(Boolean)
  return { driveId: parts.at(-3) ?? '', pledgeId: parts.at(-1) ?? '' }
}

// ─── PATCH /api/drives/[id]/pledges/[pledgeId] ──────────────────────────────
// Organizer: mark fulfilled
// Pledger:   cancel

export const PATCH = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const { driveId, pledgeId } = extractIds(req.url)

    const drive = await db.query.communityDrives.findFirst({
      where: and(eq(communityDrives.id, driveId), isNull(communityDrives.deletedAt)),
    })
    if (!drive) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    const pledge = await db.query.drivePledges.findFirst({
      where: and(eq(drivePledges.id, pledgeId), eq(drivePledges.driveId, driveId)),
    })
    if (!pledge) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    const body = await req.json().catch(() => null)
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
      .set({ status })
      .where(eq(drivePledges.id, pledgeId))
      .returning()

    if (status === 'fulfilled') {
      // Notify pledger when organizer marks fulfilled
      db.insert(notifications).values({
        userId:     pledge.userId,
        type:       'drive_pledge_fulfilled' as const,
        entityType: 'community_drive',
        entityId:   driveId,
      }).catch(() => {})
    }

    if (status === 'cancelled') {
      // Notify organizer when pledger cancels
      db.insert(notifications).values({
        userId:     drive.organizerId,
        type:       'drive_pledge_cancelled' as const,
        entityType: 'community_drive',
        entityId:   driveId,
      }).catch(() => {})
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
