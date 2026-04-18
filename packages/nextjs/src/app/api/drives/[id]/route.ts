import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { communityDrives, drivePledges, notifications } from '@/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireAuth } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { updateDriveSchema } from '@/lib/schemas/drive'
import { queryDriveById } from '@/lib/queries/drives'

type Ctx = { params: Promise<{ id: string }> }

function extractId(url: string): string {
  return new URL(url).pathname.split('/').filter(Boolean).at(-1) ?? ''
}

// ─── GET /api/drives/[id] — public detail ───────────────────────────────────

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(ip)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const { id } = await params
    const drive = await queryDriveById(id)
    if (!drive) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return NextResponse.json({ data: drive })
  } catch (err) {
    console.error('[GET /api/drives/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// ─── PATCH /api/drives/[id] — organizer edit / status change ─────────────────

export const PATCH = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const id = extractId(req.url)
    const drive = await db.query.communityDrives.findFirst({
      where: and(eq(communityDrives.id, id), isNull(communityDrives.deletedAt)),
    })
    if (!drive) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (drive.organizerId !== user.sub) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

    const body = await req.json().catch(() => null)
    const parsed = updateDriveSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const updates: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() }
    if (parsed.data.deadline) updates.deadline = new Date(parsed.data.deadline)

    const [updated] = await db.update(communityDrives).set(updates).where(eq(communityDrives.id, id)).returning()

    // Notify pledgers if drive is completed
    if (parsed.data.status === 'completed') {
      const pledgers = await db
        .select({ userId: drivePledges.userId })
        .from(drivePledges)
        .where(and(eq(drivePledges.driveId, id), eq(drivePledges.status, 'pledged')))

      if (pledgers.length > 0) {
        db.insert(notifications).values(
          pledgers.map((p) => ({
            userId:     p.userId,
            type:       'drive_completed' as const,
            entityType: 'community_drive',
            entityId:   id,
          }))
        ).catch(() => {})
      }
    }

    await writeAuditLog({ userId: user.sub, userEmail: user.email, action: 'update', entity: 'community_drives', entityId: id, ipAddress: ip })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PATCH /api/drives/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

// ─── DELETE /api/drives/[id] — soft delete ───────────────────────────────────

export const DELETE = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const id = extractId(req.url)
    const drive = await db.query.communityDrives.findFirst({
      where: and(eq(communityDrives.id, id), isNull(communityDrives.deletedAt)),
    })
    if (!drive) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    if (drive.organizerId !== user.sub) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

    await db.update(communityDrives).set({ deletedAt: new Date() }).where(eq(communityDrives.id, id))
    await writeAuditLog({ userId: user.sub, userEmail: user.email, action: 'delete', entity: 'community_drives', entityId: id, ipAddress: ip })

    return NextResponse.json({ data: { success: true } })
  } catch (err) {
    console.error('[DELETE /api/drives/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
