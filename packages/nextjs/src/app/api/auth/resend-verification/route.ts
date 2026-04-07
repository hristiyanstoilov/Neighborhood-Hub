import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { loginRatelimit } from '@/lib/ratelimit'
import { getClientIp, requireAuth } from '@/lib/middleware'
import { generateSecureToken, verificationTokenExpiresAt } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'

export const POST = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const ip = getClientIp(req)
    const { success } = await loginRatelimit.limit(user.sub)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const dbUser = await db.query.users.findFirst({ where: eq(users.id, user.sub) })
    if (!dbUser || dbUser.deletedAt) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })
    }

    if (dbUser.emailVerifiedAt) {
      return NextResponse.json({ error: 'EMAIL_ALREADY_VERIFIED' }, { status: 400 })
    }

    const token = generateSecureToken()
    const expiresAt = verificationTokenExpiresAt()

    await db
      .update(users)
      .set({
        emailVerificationToken: token,
        emailVerificationExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.sub))

    await sendVerificationEmail(dbUser.email, token)

    return NextResponse.json({ data: { message: 'Verification email sent.' } })
  } catch (err) {
    console.error('[resend-verification]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})