import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { auditLog } from '@/db/schema'
import { desc } from 'drizzle-orm'
import { requireAdmin } from '@/lib/middleware'
import { apiRatelimit } from '@/lib/ratelimit'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export const GET = requireAdmin(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const { searchParams } = new URL(req.url)
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { page, limit } = parsed.data

    const rows = await db
      .select({
        id: auditLog.id,
        userId: auditLog.userId,
        userEmail: auditLog.userEmail,
        action: auditLog.action,
        entity: auditLog.entity,
        entityId: auditLog.entityId,
        metadata: auditLog.metadata,
        createdAt: auditLog.createdAt,
      })
      .from(auditLog)
      .orderBy(desc(auditLog.createdAt))
      .limit(limit)
      .offset((page - 1) * limit)

    return NextResponse.json({ data: rows, page, limit })
  } catch (err) {
    console.error('[GET /api/admin/audit]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
