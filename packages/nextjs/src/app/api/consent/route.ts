import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { userConsents } from '@/db/schema'
import { getClientIp, requireAuthWithRateLimit } from '@/lib/middleware'

const schema = z.object({
  consentType: z.enum(['analytics', 'terms', 'marketing', 'ai_data']),
  granted: z.boolean(),
  version: z.string().max(20).default('1.0'),
})

export const POST = requireAuthWithRateLimit(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)

    const body = await req.json().catch(() => null)
    if (body === null) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const { consentType, granted, version } = parsed.data
    const now = new Date()

    await db
      .insert(userConsents)
      .values({
        userId: user.sub,
        consentType,
        granted,
        grantedAt: granted ? now : null,
        revokedAt: granted ? null : now,
        ipAddress: ip,
        version,
      })
      .onConflictDoUpdate({
        target: [userConsents.userId, userConsents.consentType, userConsents.version],
        set: {
          granted,
          grantedAt: granted ? now : null,
          revokedAt: granted ? null : now,
          ipAddress: ip,
        },
      })

    return NextResponse.json({ data: { ok: true } })
  } catch (err) {
    console.error('[POST /api/consent]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
