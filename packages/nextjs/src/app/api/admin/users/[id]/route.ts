import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireAdmin } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { uuidSchema } from '@/lib/schemas/skill'

const patchSchema = z.object({
  action: z.enum(['lock', 'unlock', 'promote', 'demote', 'delete']),
})

// ─── PATCH /api/admin/users/[id] — perform admin action on a user ─────────────

export const PATCH = requireAdmin(async (req: NextRequest, { user }) => {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').at(-1)!
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    // Admin cannot act on themselves
    if (id === user.sub) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { action } = parsed.data

    const target = await db.query.users.findFirst({
      where: and(eq(users.id, id), isNull(users.deletedAt)),
    })
    if (!target) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const now = new Date()
    let update: Partial<typeof users.$inferInsert> = { updatedAt: now }

    if (action === 'lock') {
      const lockedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24h
      update = { ...update, lockedUntil }
    } else if (action === 'unlock') {
      update = { ...update, lockedUntil: null, failedLoginAttempts: 0 }
    } else if (action === 'promote') {
      update = { ...update, role: 'admin' }
    } else if (action === 'demote') {
      update = { ...update, role: 'user' }
    } else if (action === 'delete') {
      update = { ...update, deletedAt: now }
    }

    await db.update(users).set(update).where(eq(users.id, id))

    await writeAuditLog({
      userId: user.sub,
      userEmail: user.email,
      action: action === 'delete' ? 'delete' : 'update',
      entity: 'users',
      entityId: id,
      metadata: { adminAction: action, targetEmail: target.email },
      ipAddress: ip,
    })

    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    console.error('[PATCH /api/admin/users/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
