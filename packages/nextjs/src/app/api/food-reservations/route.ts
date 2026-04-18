import { NextRequest, NextResponse } from 'next/server'
import { apiRatelimit } from '@/lib/ratelimit'
import { requireAuth } from '@/lib/middleware'
import { listFoodReservationsSchema } from '@/lib/schemas/food'
import { queryFoodReservationsForUser } from '@/lib/queries/food'

export const GET = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const { searchParams } = new URL(req.url)
    const parsed = listFoodReservationsSchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const rows = await queryFoodReservationsForUser(user.sub, parsed.data.role)
    return NextResponse.json({ data: rows })
  } catch (err) {
    console.error('[GET /api/food-reservations]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})