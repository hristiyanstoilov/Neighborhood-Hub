import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGINS = [
  'https://hristiyanstoilov.github.io',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:8081'] : []),
]

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') ?? ''
  const isAllowed = ALLOWED_ORIGINS.includes(origin)

  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      response.headers.set('Access-Control-Max-Age', '86400')
    }
    return response
  }

  const response = NextResponse.next()
  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }
  return response
}

export const config = {
  matcher: '/api/:path*',
}
