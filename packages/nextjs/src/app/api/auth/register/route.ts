import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { users, profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { generateSecureToken, verificationTokenExpiresAt } from '@/lib/auth'
import { sendVerificationEmail } from '@/lib/email'
import { registerRatelimit } from '@/lib/ratelimit'
import { getClientIp } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(2).max(100).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const { success } = await registerRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { email, password, name } = parsed.data

    const existing = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) })
    if (existing) {
      return NextResponse.json({ error: 'EMAIL_TAKEN' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const verificationToken = generateSecureToken()
    const verificationExpiresAt = verificationTokenExpiresAt()

    // neon-http does not support transactions, so insert user first,
    // then create profile and clean up user if profile insert fails.
    const [user] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        emailVerificationToken: verificationToken,
        emailVerificationExpiresAt: verificationExpiresAt,
      })
      .returning({ id: users.id, email: users.email, role: users.role })

    try {
      await db.insert(profiles).values({
        userId: user.id,
        name: name ?? null,
      })
    } catch (profileErr) {
      await db.delete(users).where(eq(users.id, user.id))
      throw profileErr
    }

    await writeAuditLog({
      userId: user.id,
      userEmail: user.email,
      action: 'register',
      entity: 'users',
      entityId: user.id,
      ipAddress: ip,
    })

    // Send verification email — failure is non-fatal: account is already created.
    // User can request a resend later.
    try {
      await sendVerificationEmail(user.email, verificationToken)
    } catch (emailErr) {
      console.error('[register] verification email failed', emailErr)
    }

    return NextResponse.json(
      { data: { id: user.id, email: user.email, message: 'Account created. Check your email to verify.' } },
      { status: 201 }
    )
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
