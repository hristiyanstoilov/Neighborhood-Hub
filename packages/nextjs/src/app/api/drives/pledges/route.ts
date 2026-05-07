import { NextResponse } from 'next/server'
import { requireAuthWithRateLimit } from '@/lib/middleware'
import { queryUserPledges } from '@/lib/queries/drives'

// ─── GET /api/drives/pledges — current user's pledges ───────────────────────

export const GET = requireAuthWithRateLimit(async (_req, { user }) => {
  try {
    const rows = await queryUserPledges(user.sub)
    return NextResponse.json({ data: rows })
  } catch (err) {
    console.error('[GET /api/drives/pledges]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
