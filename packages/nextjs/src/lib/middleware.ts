import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, JwtPayload } from './auth'

export type AuthedRequest = NextRequest & { user: JwtPayload }

export function requireAuth(
  handler: (req: NextRequest, context: { user: JwtPayload }) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authHeader = req.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const token = authHeader.slice(7)

    try {
      const user = verifyAccessToken(token)
      return handler(req, { user })
    } catch {
      return NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 401 })
    }
  }
}

export function requireAdmin(
  handler: (req: NextRequest, context: { user: JwtPayload }) => Promise<NextResponse>
) {
  return requireAuth(async (req, { user }) => {
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }
    return handler(req, { user })
  })
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}
