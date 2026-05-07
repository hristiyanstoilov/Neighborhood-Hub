import { NextResponse } from 'next/server'
import { requireAuthWithRateLimit } from '@/lib/middleware'
import { queryUserRsvps } from '@/lib/queries/events'

// ─── GET /api/events/rsvps — current user's RSVPs ───────────────────────────

export const GET = requireAuthWithRateLimit(async (_req, { user }) => {
  try {
    const rows = await queryUserRsvps(user.sub)
    return NextResponse.json({ data: rows })
  } catch (err) {
    console.error('[GET /api/events/rsvps]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
