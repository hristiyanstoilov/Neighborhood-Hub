import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { generateSecureToken, passwordResetTokenExpiresAt } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/email'
import { loginRatelimit } from '@/lib/ratelimit'
import { getClientIp } from '@/lib/middleware'

const schema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const { success } = await loginRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      // Always 200 — don't leak whether an email format was invalid vs not found
      return NextResponse.json({
        data: { message: 'If that email exists, a reset link has been sent.' },
      })
    }

    const { email } = parsed.data

    // Always return 200 — never reveal whether the email exists
    const user = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) })

    if (user && !user.deletedAt) {
      const token = generateSecureToken()
      const expiresAt = passwordResetTokenExpiresAt()

      await db
        .update(users)
        .set({ passwordResetToken: token, passwordResetExpiresAt: expiresAt, updatedAt: new Date() })
        .where(eq(users.id, user.id))

      // Non-fatal: email failure doesn't break the flow
      sendPasswordResetEmail(user.email, token).catch((err) => {
        console.error('[forgot-password] email failed', err)
      })
    }

    return NextResponse.json({
      data: { message: 'If that email exists, a reset link has been sent.' },
    })
  } catch (err) {
    console.error('[forgot-password]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
