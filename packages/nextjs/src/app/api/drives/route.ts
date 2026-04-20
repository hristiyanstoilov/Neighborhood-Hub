import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { communityDrives, users } from '@/db/schema'
import { and, count, isNull } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireAuth } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { createDriveSchema, listDrivesSchema } from '@/lib/schemas/drive'
import { buildDriveConditions, queryDrives } from '@/lib/queries/drives'
import { eq } from 'drizzle-orm'

// ─── GET /api/drives — public listing ───────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(ip)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const { searchParams } = new URL(req.url)
    const parsed = listDrivesSchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { status, driveType, limit, page } = parsed.data
    const conditions = buildDriveConditions({ status, driveType })

    const [rows, [{ total }]] = await Promise.all([
      queryDrives({ status, driveType, limit, page }),
      db.select({ total: count() }).from(communityDrives).where(and(...conditions)),
    ])

    return NextResponse.json({ data: rows, page, limit, total })
  } catch (err) {
    console.error('[GET /api/drives]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

// ─── POST /api/drives — create ───────────────────────────────────────────────

export const POST = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.sub) })
    if (!dbUser?.emailVerifiedAt) {
      return NextResponse.json({ error: 'UNVERIFIED_EMAIL' }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    const parsed = createDriveSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { title, description, driveType, goalDescription, dropOffAddress, deadline, imageUrl } = parsed.data

    const [drive] = await db.insert(communityDrives).values({
      organizerId:     user.sub,
      title,
      description:     description ?? null,
      driveType,
      goalDescription: goalDescription ?? null,
      dropOffAddress:  dropOffAddress ?? null,
      deadline:        deadline ? new Date(deadline) : null,
      imageUrl:        imageUrl ?? null,
    }).returning()

    await writeAuditLog({ userId: user.sub, userEmail: user.email, action: 'create', entity: 'community_drives', entityId: drive.id, ipAddress: ip })

    const authHeader = req.headers.get('authorization')
    if (authHeader) {
      void fetch(`${req.nextUrl.origin}/api/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          eventType: 'drive_opened',
          targetId: drive.id,
          targetTitle: drive.title,
          targetUrl: `/drives/${drive.id}`,
        }),
      }).catch(() => undefined)
    }

    return NextResponse.json({ data: drive }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/drives]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
