import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithRateLimit } from '@/lib/middleware'
import { listFoodReservationsSchema } from '@/lib/schemas/food'
import { queryFoodReservationsForUser } from '@/lib/queries/food'

export const GET = requireAuthWithRateLimit(async (req: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = listFoodReservationsSchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const rawLimit = parseInt(searchParams.get('limit') ?? '20', 10)
    const rawOffset = parseInt(searchParams.get('offset') ?? '0', 10)
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 20
    const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0

    const rows = await queryFoodReservationsForUser(user.sub, parsed.data.role, limit, offset)
    return NextResponse.json({ data: rows, limit, offset })
  } catch (err) {
    console.error('[GET /api/food-reservations]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})