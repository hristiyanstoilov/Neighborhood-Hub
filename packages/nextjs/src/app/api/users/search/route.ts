import { NextRequest, NextResponse } from 'next/server'
import { and, eq, ilike, isNull, ne, or } from 'drizzle-orm'
import { db } from '@/db'
import { users, profiles } from '@/db/schema'
import { requireAuth } from '@/lib/middleware'

export const GET = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''

    if (q.length < 2) {
      return NextResponse.json({ data: { users: [] } })
    }

    const pattern = `%${q}%`

    const rows = await db
      .select({
        id: users.id,
        name: profiles.name,
        avatarUrl: profiles.avatarUrl,
      })
      .from(users)
      .innerJoin(profiles, eq(profiles.userId, users.id))
      .where(and(
        isNull(users.deletedAt),
        ne(users.id, user.sub),
        or(
          ilike(users.email, pattern),
          ilike(profiles.name, pattern),
        ),
      ))
      .limit(10)

    return NextResponse.json({ data: { users: rows } })
  } catch (err) {
    console.error('[GET /api/users/search]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
