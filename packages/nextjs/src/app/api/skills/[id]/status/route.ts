import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { skills } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireAuth } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'
import { skillStatusSchema, uuidSchema } from '@/lib/schemas/skill'

// ─── PATCH /api/skills/[id]/status — change status (owner only) ──────────────

export const PATCH = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const url = new URL(req.url)
    const id = url.pathname.split('/').at(-2)!
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const parsed = skillStatusSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const existing = await db.query.skills.findFirst({
      where: and(eq(skills.id, id), eq(skills.ownerId, user.sub), isNull(skills.deletedAt)),
    })
    if (!existing) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const [updated] = await db
      .update(skills)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(and(eq(skills.id, id), eq(skills.ownerId, user.sub)))
      .returning()

    await writeAuditLog({
      userId: user.sub,
      userEmail: user.email,
      action: 'update',
      entity: 'skills',
      entityId: id,
      metadata: { status: parsed.data.status },
      ipAddress: ip,
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[PATCH /api/skills/[id]/status]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
