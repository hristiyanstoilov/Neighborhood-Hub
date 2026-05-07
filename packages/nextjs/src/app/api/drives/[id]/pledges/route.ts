import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { communityDrives, drivePledges, userBlocks } from '@/db/schema'
import { and, eq, isNull, or } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireVerifiedAuthWithRateLimit } from '@/lib/middleware'
import { createPledgeSchema } from '@/lib/schemas/drive'
import { queryDrivePledges, queryUserPledge } from '@/lib/queries/drives'
import { createNotification } from '@/lib/create-notification'
import { isUniqueViolation } from '@/lib/db-errors'

type Ctx = { params: Promise<{ id: string }> }

// ─── GET /api/drives/[id]/pledges — public pledge list ──────────────────────

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(ip)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const { id } = await params
    const drive = await db.query.communityDrives.findFirst({
      where: and(eq(communityDrives.id, id), isNull(communityDrives.deletedAt)),
    })
    if (!drive) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    const page = Math.max(1, Number(req.nextUrl.searchParams.get('page')) || 1)
    const pledges = await queryDrivePledges(id, { limit: 100, offset: (page - 1) * 100 })
    return NextResponse.json({ data: pledges })
  } catch (err) {
    console.error('[GET /api/drives/[id]/pledges]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// ─── POST /api/drives/[id]/pledges — create pledge ──────────────────────────

export const POST = requireVerifiedAuthWithRateLimit(async (req: NextRequest, { user, params }) => {
  try {
    const driveId = params.id
    const drive = await db.query.communityDrives.findFirst({
      where: and(eq(communityDrives.id, driveId), isNull(communityDrives.deletedAt)),
    })
    if (!drive) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (drive.status !== 'open') return NextResponse.json({ error: 'DRIVE_NOT_OPEN' }, { status: 422 })
    if (drive.organizerId === user.sub) return NextResponse.json({ error: 'CANNOT_PLEDGE_OWN_DRIVE' }, { status: 422 })

    const [blockRow] = await db
      .select({ id: userBlocks.id })
      .from(userBlocks)
      .where(or(
        and(eq(userBlocks.blockerId, user.sub), eq(userBlocks.blockedId, drive.organizerId)),
        and(eq(userBlocks.blockerId, drive.organizerId), eq(userBlocks.blockedId, user.sub)),
      ))
      .limit(1)
    if (blockRow) return NextResponse.json({ error: 'BLOCKED' }, { status: 403 })

    const body = await req.json().catch(() => null)
    if (body === null) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
    const parsed = createPledgeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    // Idempotent — if already pledged return existing
    const existing = await queryUserPledge(driveId, user.sub)
    if (existing?.status === 'pledged') {
      return NextResponse.json({ data: existing })
    }

    if (existing) {
      // Re-pledging after cancelling — update description + status
      const [updated] = await db
        .update(drivePledges)
        .set({ status: 'pledged', pledgeDescription: parsed.data.pledgeDescription })
        .where(eq(drivePledges.id, existing.id))
        .returning()
      return NextResponse.json({ data: updated })
    }

    let pledge: typeof drivePledges.$inferSelect
    try {
      const [inserted] = await db.insert(drivePledges).values({
        driveId,
        userId:            user.sub,
        pledgeDescription: parsed.data.pledgeDescription,
      }).returning()
      pledge = inserted
    } catch (insertErr) {
      if (isUniqueViolation(insertErr)) {
        // Race: another request inserted first — return whatever exists now
        const raceExisting = await queryUserPledge(driveId, user.sub)
        if (raceExisting) return NextResponse.json({ data: raceExisting })
      }
      throw insertErr
    }

    // Notify organizer
    void createNotification({
      userId: drive.organizerId,
      type: 'drive_new_pledge',
      entityType: 'community_drive',
      entityId: driveId,
    }).catch(() => {})

    return NextResponse.json({ data: pledge }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/drives/[id]/pledges]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
