import { NextRequest, NextResponse } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { ratings } from '@/db/schema'
import { apiRatelimit } from '@/lib/ratelimit'
import { requireAuth } from '@/lib/middleware'
import { checkRatingQuerySchema } from '@/lib/schemas/rating'

export const GET = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const parsed = checkRatingQuerySchema.safeParse(
      Object.fromEntries(new URL(req.url).searchParams)
    )

    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { contextType, contextId } = parsed.data

    const [existingRating] = await db
      .select({
        id: ratings.id,
        score: ratings.score,
        comment: ratings.comment,
        createdAt: ratings.createdAt,
      })
      .from(ratings)
      .where(
        and(
          eq(ratings.raterId, user.sub),
          eq(ratings.contextType, contextType),
          eq(ratings.contextId, contextId)
        )
      )
      .limit(1)

    return NextResponse.json({
      data: {
        hasRated: Boolean(existingRating),
        existingRating: existingRating ?? null,
      },
    })
  } catch (err) {
    console.error('[GET /api/ratings/check]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
