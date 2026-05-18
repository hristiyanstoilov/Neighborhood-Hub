import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { userBlocks, users } from '@/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { requireAuthWithRateLimit, getClientIp } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { uuidSchema } from '@/lib/schemas/skill'

export const GET = requireAuthWithRateLimit(async (req: NextRequest, { user, params }) => {
  try {
    const targetId = params.id
    if (!uuidSchema.safeParse(targetId).success) {
      return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 })
    }

    const [byMe, byThem] = await Promise.all([
      db
        .select({ id: userBlocks.id })
        .from(userBlocks)
        .where(and(eq(userBlocks.blockerId, user.sub), eq(userBlocks.blockedId, targetId)))
        .limit(1),
      db
        .select({ id: userBlocks.id })
        .from(userBlocks)
        .where(and(eq(userBlocks.blockerId, targetId), eq(userBlocks.blockedId, user.sub)))
        .limit(1),
    ])

    return NextResponse.json({ data: { blockedByMe: byMe.length > 0, blockedByThem: byThem.length > 0 } })
  } catch (err) {
    console.error('[GET /api/users/[id]/block]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

export const POST = requireAuthWithRateLimit(async (req: NextRequest, { user, params }) => {
  try {
    const ip = getClientIp(req)
    const targetId = params.id
    if (!uuidSchema.safeParse(targetId).success) {
      return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 })
    }
    if (targetId === user.sub) {
      return NextResponse.json({ error: 'CANNOT_BLOCK_SELF' }, { status: 400 })
    }

    const [target] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, targetId), isNull(users.deletedAt)))
      .limit(1)

    if (!target) return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })

    await db
      .insert(userBlocks)
      .values({ blockerId: user.sub, blockedId: targetId })
      .onConflictDoNothing()

    await writeAuditLog({ userId: user.sub, userEmail: user.email, action: 'create', entity: 'user_blocks', entityId: targetId, ipAddress: ip })

    return NextResponse.json({ data: { blocked: true } }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/users/[id]/block]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

export const DELETE = requireAuthWithRateLimit(async (req: NextRequest, { user, params }) => {
  try {
    const ip = getClientIp(req)
    const targetId = params.id
    if (!uuidSchema.safeParse(targetId).success) {
      return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 })
    }

    await db
      .delete(userBlocks)
      .where(and(eq(userBlocks.blockerId, user.sub), eq(userBlocks.blockedId, targetId)))

    await writeAuditLog({ userId: user.sub, userEmail: user.email, action: 'delete', entity: 'user_blocks', entityId: targetId, ipAddress: ip })

    return NextResponse.json({ data: { blocked: false } })
  } catch (err) {
    console.error('[DELETE /api/users/[id]/block]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
