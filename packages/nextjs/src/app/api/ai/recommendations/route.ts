import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/middleware'
import { aiRatelimit } from '@/lib/ratelimit'
import { queryRecommendedSkills } from '@/lib/queries/recommendations'

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(10).default(5),
})

export const GET = requireAuth(async (req: NextRequest, { user }) => {
  const { success } = await aiRatelimit.limit(user.sub)
  if (!success) {
    return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
  }

  try {
    const data = await queryRecommendedSkills(user.sub, parsed.data.limit)
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/ai/recommendations]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})