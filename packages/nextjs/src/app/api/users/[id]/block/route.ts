import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { userBlocks } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { requireAuth } from '@/lib/middleware'
import { uuidSchema } from '@/lib/schemas/skill'

type Params = { params: Promise<{ id: string }> }

export const POST = requireAuth(async (req: NextRequest, { user, params }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const targetId = (params as Record<string, string>).id
    if (!uuidSchema.safeParse(targetId).success) {
      return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 })
    }
    if (targetId === user.sub) {
      return NextResponse.json({ error: 'CANNOT_BLOCK_SELF' }, { status: 400 })
    }

    await db
      .insert(userBlocks)
      .values({ blockerId: user.sub, blockedId: targetId })
      .onConflictDoNothing()

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/users/[id]/block]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

export const DELETE = requireAuth(async (req: NextRequest, { user, params }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const targetId = (params as Record<string, string>).id
    if (!uuidSchema.safeParse(targetId).success) {
      return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 })
    }

    await db
      .delete(userBlocks)
      .where(and(eq(userBlocks.blockerId, user.sub), eq(userBlocks.blockedId, targetId)))

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[DELETE /api/users/[id]/block]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
