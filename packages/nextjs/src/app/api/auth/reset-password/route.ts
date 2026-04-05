import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { users, refreshTokens } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { loginRatelimit } from '@/lib/ratelimit'
import { getClientIp } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'

const schema = z.object({
  token: z.string().length(64),
  password: z.string().min(8).max(72),
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
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { token, password } = parsed.data

    const user = await db.query.users.findFirst({
      where: eq(users.passwordResetToken, token),
    })

    if (!user || user.deletedAt) {
      return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 400 })
    }

    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      return NextResponse.json({ error: 'TOKEN_EXPIRED' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await db
      .update(users)
      .set({
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))

    // Revoke all refresh tokens — forces re-login on all devices
    await db
      .update(refreshTokens)
      .set({ isRevoked: true })
      .where(and(eq(refreshTokens.userId, user.id), eq(refreshTokens.isRevoked, false)))

    await writeAuditLog({
      userId: user.id,
      userEmail: user.email,
      action: 'reset_password',
      entity: 'users',
      entityId: user.id,
      ipAddress: ip,
    })

    return NextResponse.json({ data: { message: 'Password updated. Please log in.' } })
  } catch (err) {
    console.error('[reset-password]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
