import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, JwtPayload } from './auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

const DEMO_USER_EMAIL = 'demo@neighborhoodhub.bg'

export type AuthedRequest = NextRequest & { user: JwtPayload }

type RouteContext = { params?: Promise<Record<string, string>> }

export function requireAuth(
  handler: (req: NextRequest, context: { user: JwtPayload; params: Record<string, string> }) => Promise<NextResponse>
) {
  return async (req: NextRequest, routeContext?: RouteContext): Promise<NextResponse> => {
    const authHeader = req.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const token = authHeader.slice(7)

    try {
      const user = verifyAccessToken(token)
      const isDemoUser = user.email.toLowerCase() === DEMO_USER_EMAIL
      const isMutatingRequest = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase())
      const isAuthLogout = req.nextUrl.pathname === '/api/auth/logout'

      if (isDemoUser && isMutatingRequest && !isAuthLogout) {
        return NextResponse.json({ error: 'DEMO_USER_READ_ONLY' }, { status: 403 })
      }

      const params = routeContext?.params ? await routeContext.params : {}
      return handler(req, { user, params })
    } catch {
      return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 401 })
    }
  }
}

export function requireVerifiedAuth(
  handler: (req: NextRequest, context: { user: JwtPayload; params: Record<string, string> }) => Promise<NextResponse>
) {
  return requireAuth(async (req, context) => {
    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, context.user.sub),
      columns: { emailVerifiedAt: true },
    })
    if (!dbUser?.emailVerifiedAt) {
      return NextResponse.json({ error: 'UNVERIFIED_EMAIL' }, { status: 403 })
    }
    return handler(req, context)
  })
}

export function requireAdmin(
  handler: (req: NextRequest, context: { user: JwtPayload; params: Record<string, string> }) => Promise<NextResponse>
) {
  return requireAuth(async (req, { user, params }) => {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }
    return handler(req, { user, params })
  })
}

const IPV4 = /^(\d{1,3}\.){3}\d{1,3}$/
const IPV6 = /^[0-9a-f:]+$/i

function isValidIp(ip: string): boolean {
  return IPV4.test(ip) || IPV6.test(ip)
}

export function getClientIp(req: NextRequest): string {
  // x-forwarded-for may contain a comma-separated list; take the first entry
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
  if (forwarded && isValidIp(forwarded)) return forwarded

  const realIp = req.headers.get('x-real-ip')?.trim()
  if (realIp && isValidIp(realIp)) return realIp

  return '127.0.0.1'
}
