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

    const rows = await queryFoodReservationsForUser(user.sub, parsed.data.role)
    return NextResponse.json({ data: rows })
  } catch (err) {
    console.error('[GET /api/food-reservations]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})