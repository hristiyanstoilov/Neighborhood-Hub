import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { apiRatelimit } from '@/lib/ratelimit'
import { queryUserRsvps } from '@/lib/queries/events'

// ─── GET /api/events/rsvps — current user's RSVPs ───────────────────────────

export const GET = requireAuth(async (_req, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const rows = await queryUserRsvps(user.sub)
    return NextResponse.json({ data: rows })
  } catch (err) {
    console.error('[GET /api/events/rsvps]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
