import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { skills, tools, events, communityDrives, foodShares } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireAdmin } from '@/lib/middleware'
import { apiRatelimit } from '@/lib/ratelimit'
import { writeAuditLog } from '@/lib/audit'
import { getClientIp } from '@/lib/middleware'
import { z } from 'zod'

const schema = z.object({
  type: z.enum(['skill', 'tool', 'event', 'drive', 'food']),
  id: z.string().uuid(),
})

export const DELETE = requireAdmin(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const { type, id } = parsed.data
    const now = new Date()
    const ip = getClientIp(req)

    let deleted = false

    if (type === 'skill') {
      const [row] = await db.update(skills).set({ deletedAt: now }).where(eq(skills.id, id)).returning()
      deleted = !!row
    } else if (type === 'tool') {
      const [row] = await db.update(tools).set({ deletedAt: now }).where(eq(tools.id, id)).returning()
      deleted = !!row
    } else if (type === 'event') {
      const [row] = await db.update(events).set({ deletedAt: now, status: 'cancelled' }).where(eq(events.id, id)).returning()
      deleted = !!row
    } else if (type === 'drive') {
      const [row] = await db.update(communityDrives).set({ deletedAt: now }).where(eq(communityDrives.id, id)).returning()
      deleted = !!row
    } else if (type === 'food') {
      const [row] = await db.update(foodShares).set({ deletedAt: now, status: 'cancelled' }).where(eq(foodShares.id, id)).returning()
      deleted = !!row
    }

    if (!deleted) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    await writeAuditLog({
      userId: user.sub,
      userEmail: user.email,
      action: 'delete',
      entity: type,
      entityId: id,
      ipAddress: ip,
    })

    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    console.error('[DELETE /api/admin/listings]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

