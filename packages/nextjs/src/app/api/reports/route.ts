import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { contentReports, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { requireAuth } from '@/lib/middleware'
import { isUniqueViolation } from '@/lib/db-errors'

const createReportSchema = z.object({
  entityType: z.enum(['skill', 'tool', 'food_share', 'event', 'community_drive']),
  entityId: z.string().uuid(),
  reason: z.enum(['spam', 'inappropriate', 'misleading', 'other']),
})

export const POST = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.sub) })
    if (!dbUser || dbUser.deletedAt) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

    const body = await req.json().catch(() => null)
    const parsed = createReportSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { entityType, entityId, reason } = parsed.data

    const [report] = await db
      .insert(contentReports)
      .values({ reporterId: user.sub, entityType, entityId, reason })
      .returning()

    return NextResponse.json({ data: report }, { status: 201 })
  } catch (err) {
    if (isUniqueViolation(err, 'content_reports_active_idx')) {
      return NextResponse.json({ error: 'ALREADY_REPORTED' }, { status: 409 })
    }
    console.error('[POST /api/reports]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
