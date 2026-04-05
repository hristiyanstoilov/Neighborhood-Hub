import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/db'
import { users, refreshTokens, profiles } from '@/db/schema'
import { eq } from 'drizzle-orm'
import {
  signAccessToken,
  generateSecureToken,
  refreshTokenExpiresAt,
} from '@/lib/auth'
import { loginRatelimit } from '@/lib/ratelimit'
import { getClientIp } from '@/lib/middleware'
import { writeAuditLog } from '@/lib/audit'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const LOCK_DURATION_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

// Dummy hash used when user is not found — ensures timing is identical
// to a real failed login, preventing user enumeration via response time.
const DUMMY_HASH = '$2b$12$dummyhashfortimingpurposesXXXXXXXXXXXXXXXXXXX..'

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

    const { email, password } = parsed.data

    const user = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) })

    // Always run bcrypt regardless of whether the user exists.
    // This prevents timing-based user enumeration attacks.
    const passwordMatch = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)

    if (!user || user.deletedAt || !passwordMatch) {
      // Increment failed attempts only if user exists and password was wrong
      if (user && !user.deletedAt && !passwordMatch) {
        const newAttempts = (user.failedLoginAttempts ?? 0) + 1
        const shouldLock = newAttempts >= MAX_ATTEMPTS

        await db
          .update(users)
          .set({
            failedLoginAttempts: newAttempts,
            lockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : null,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id))
      }

      return NextResponse.json({ error: 'INVALID_CREDENTIALS' }, { status: 401 })
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json({ error: 'ACCOUNT_LOCKED', lockedUntil: user.lockedUntil }, { status: 423 })
    }

    await db
      .update(users)
      .set({ failedLoginAttempts: 0, lockedUntil: null, updatedAt: new Date() })
      .where(eq(users.id, user.id))

    const payload = { sub: user.id, email: user.email, role: user.role }
    const accessToken = signAccessToken(payload)
    const rawRefreshToken = generateSecureToken()
    const expiresAt = refreshTokenExpiresAt()

    await db.insert(refreshTokens).values({
      userId: user.id,
      token: rawRefreshToken,
      expiresAt,
      ipAddress: ip,
      userAgent: req.headers.get('user-agent') ?? undefined,
    })

    await writeAuditLog({
      userId: user.id,
      userEmail: user.email,
      action: 'login',
      entity: 'users',
      entityId: user.id,
      ipAddress: ip,
    })

    const profile = await db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) })

    const response = NextResponse.json({
      data: {
        accessToken,
        refreshToken: rawRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerifiedAt: user.emailVerifiedAt,
          profile: profile
            ? {
                name: profile.name,
                bio: profile.bio,
                avatarUrl: profile.avatarUrl,
                isPublic: profile.isPublic,
                locationId: profile.locationId,
              }
            : null,
        },
      },
    })

    response.cookies.set('refresh_token', rawRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (err) {
    console.error('[login]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
