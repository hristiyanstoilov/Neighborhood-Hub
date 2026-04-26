import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { contentReports, users, profiles } from '@/db/schema'
import { desc, eq, isNull, isNotNull } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { requireAdmin } from '@/lib/middleware'

const querySchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(['pending', 'resolved', 'all']).default('pending'),
})

export const GET = requireAdmin(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const { searchParams } = new URL(req.url)
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { page, limit, status } = parsed.data

    const whereClause =
      status === 'pending'  ? isNull(contentReports.resolvedAt) :
      status === 'resolved' ? isNotNull(contentReports.resolvedAt) :
      undefined

    const rows = await db
      .select({
        id:           contentReports.id,
        entityType:   contentReports.entityType,
        entityId:     contentReports.entityId,
        reason:       contentReports.reason,
        resolvedAt:   contentReports.resolvedAt,
        resolvedById: contentReports.resolvedById,
        createdAt:    contentReports.createdAt,
        reporterEmail: users.email,
        reporterName:  profiles.name,
      })
      .from(contentReports)
      .leftJoin(users,    eq(contentReports.reporterId, users.id))
      .leftJoin(profiles, eq(contentReports.reporterId, profiles.userId))
      .where(whereClause)
      .orderBy(desc(contentReports.createdAt))
      .limit(limit)
      .offset((page - 1) * limit)

    return NextResponse.json({ data: rows, page, limit })
  } catch (err) {
    console.error('[GET /api/admin/reports]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
