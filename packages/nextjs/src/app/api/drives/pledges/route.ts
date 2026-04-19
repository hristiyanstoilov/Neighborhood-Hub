import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { apiRatelimit } from '@/lib/ratelimit'
import { queryUserPledges } from '@/lib/queries/drives'

// ─── GET /api/drives/pledges — current user's pledges ───────────────────────

export const GET = requireAuth(async (_req, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const rows = await queryUserPledges(user.sub)
    return NextResponse.json({ data: rows })
  } catch (err) {
    console.error('[GET /api/drives/pledges]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
