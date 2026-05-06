import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { reports, users, profiles } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/middleware'
import { apiRatelimit } from '@/lib/ratelimit'
import { z } from 'zod'

const filterSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'dismissed']).optional(),
})

export const GET = requireAdmin(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const params = Object.fromEntries(new URL(req.url).searchParams)
    const { status } = filterSchema.parse(params)

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

const patchSchema = z.object({
  id:     z.string().uuid(),
  status: z.enum(['reviewed', 'dismissed']),
})

export const PATCH = requireAdmin(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const body = await req.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })

    const { id, status } = parsed.data
    await db
      .update(reports)
      .set({ status, reviewedById: user.sub, reviewedAt: new Date() })
      .where(eq(reports.id, id))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/admin/reports]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
