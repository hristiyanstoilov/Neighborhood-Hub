import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { loginRatelimit } from '@/lib/ratelimit'
import { getClientIp } from '@/lib/middleware'

const schema = z.object({
  token: z.string().length(64),
})

export async function POST(req: NextRequest) {
  try {
    const { success } = await loginRatelimit.limit(getClientIp(req))
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { token } = parsed.data

    const user = await db.query.users.findFirst({
      where: eq(users.emailVerificationToken, token),
    })

    if (!user) {
      return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 400 })
    }

    if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
      return NextResponse.json({ error: 'TOKEN_EXPIRED' }, { status: 400 })
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json({ data: { message: 'Email already verified.' } })
    }

    await db
      .update(users)
      .set({
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    return NextResponse.json({ data: { message: 'Email verified successfully.' } })
  } catch (err) {
    console.error('[verify-email]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
