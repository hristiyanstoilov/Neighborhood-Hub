import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { reports } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuthWithRateLimit } from '@/lib/middleware'
import { createRatelimit } from '@/lib/ratelimit'
import { z } from 'zod'

const schema = z.object({
  targetType: z.enum(['skill', 'tool', 'event', 'food', 'drive', 'user', 'message']),
  targetId:   z.string().uuid(),
  reason:     z.enum(['spam', 'inappropriate', 'misleading', 'dangerous', 'other']),
  details:    z.string().max(500).optional(),
})

export const POST = requireAuthWithRateLimit(async (req: NextRequest, { user }) => {
  try {
    const { success: createOk } = await createRatelimit.limit(user.sub)
    if (!createOk) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const body = await req.json().catch(() => null)
    if (body === null) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
    }

    const { targetType, targetId, reason, details } = parsed.data

    if (targetType === 'user' && targetId === user.sub) {
      return NextResponse.json({ error: 'CANNOT_REPORT_SELF' }, { status: 400 })
    }

    // Prevent duplicate reports from the same user on the same target
    const existing = await db
      .select({ id: reports.id })
      .from(reports)
      .where(and(
        eq(reports.reporterId, user.sub),
        eq(reports.targetType, targetType),
        eq(reports.targetId, targetId),
      ))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json({ error: 'ALREADY_REPORTED' }, { status: 409 })
    }

    await db.insert(reports).values({
      reporterId: user.sub,
      targetType,
      targetId,
      reason,
      details: details ?? null,
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/reports]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
