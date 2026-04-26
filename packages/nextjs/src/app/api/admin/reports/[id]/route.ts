import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { contentReports } from '@/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { requireAdmin } from '@/lib/middleware'

function extractId(url: string): string {
  return new URL(url).pathname.split('/').filter(Boolean).at(-1) ?? ''
}

export const PATCH = requireAdmin(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const id = extractId(req.url)
    const report = await db.query.contentReports.findFirst({
      where: and(eq(contentReports.id, id), isNull(contentReports.resolvedAt)),
    })
    if (!report) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

    const [updated] = await db
      .update(contentReports)
      .set({ resolvedAt: new Date(), resolvedById: user.sub })
      .where(eq(contentReports.id, id))
      .returning()

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PATCH /api/admin/reports/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
