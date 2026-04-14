const BASE_URL = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000'
const EMAIL = process.env.SMOKE_AUTH_EMAIL || ''
const PASSWORD = process.env.SMOKE_AUTH_PASSWORD || ''
const STRICT = process.env.SMOKE_AUTH_STRICT === 'true'
const os = await import('node:os')
const path = await import('node:path')
const fs = await import('node:fs/promises')
const CACHE_FILE = path.join(os.tmpdir(), 'neighborhood-hub-smoke-refresh-token.json')

function fullUrl(path) {
  return `${BASE_URL}${path}`
}

function fail(message) {
  throw new Error(message)
}

function authHeaders(token) {
  return {
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
  }
}

function extractRefreshTokenFromSetCookie(setCookieHeader) {
  if (!setCookieHeader) return null
  const match = setCookieHeader.match(/(?:^|[,;]\s*)refresh_token=([^;]+)/i)
  return match?.[1] ?? null
}

async function writeCachedRefreshToken(refreshToken) {
  if (!refreshToken) return

  try {
    await fs.writeFile(CACHE_FILE, JSON.stringify({ refreshToken }), 'utf8')
  } catch {
    // Best-effort cache.
  }
}

async function login() {
  const res = await fetch(fullUrl('/api/auth/login'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '127.0.0.30',
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const error = body?.error || 'LOGIN_FAILED'
    fail(`Auth smoke login failed with ${res.status}: ${error}`)
  }

  const token = body?.data?.accessToken
  if (!token) {
    fail('Auth smoke login succeeded but accessToken is missing')
  }

  const refreshTokenFromBody = body?.data?.refreshToken ?? null
  const refreshTokenFromHeader = extractRefreshTokenFromSetCookie(res.headers.get('set-cookie'))
  await writeCachedRefreshToken(refreshTokenFromBody || refreshTokenFromHeader)

  return token
}

async function assertAuthApi(path, token, accepted = [200]) {
  const res = await fetch(fullUrl(path), {
    headers: {
      authorization: `Bearer ${token}`,
    },
  })

  if (!accepted.includes(res.status)) {
    const text = await res.text()
    fail(`Expected ${path} -> ${accepted.join('/')} got ${res.status}. Body: ${text.slice(0, 180)}`)
  }

  console.log(`OK auth api ${path} -> ${res.status}`)
}

async function assertChat(token) {
  const res = await fetch(fullUrl('/api/ai/chat'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ message: 'CI auth smoke: explain neighborhood radar in one sentence.' }),
  })

  // 200: success
  // 503: AI provider unavailable
  // 429: user rate limited
  if (![200, 429, 503].includes(res.status)) {
    const text = await res.text()
    fail(`Expected /api/ai/chat -> 200/429/503, got ${res.status}. Body: ${text.slice(0, 220)}`)
  }

  if (res.status !== 200) {
    console.log(`OK auth chat degraded status -> ${res.status}`)
    return
  }

  const body = await res.json().catch(() => null)
  const message = body?.data?.message?.content
  if (!message || typeof message !== 'string') {
    fail('Expected successful chat response to include assistant message content')
  }

  console.log('OK auth chat success -> 200')
}

async function main() {
  console.log(`Running authenticated smoke checks against ${BASE_URL}`)

  if (!EMAIL || !PASSWORD) {
    const message = 'SMOKE_AUTH_EMAIL or SMOKE_AUTH_PASSWORD is not set'
    if (STRICT) {
      fail(`Authenticated smoke failed: ${message}`)
    }
    console.log(`Skipping authenticated smoke: ${message}`)
    return
  }

  const token = await login()

  await assertAuthApi('/api/profile', token, [200])
  await assertAuthApi('/api/notifications', token, [200])
  await assertAuthApi('/api/ai/recommendations?limit=5', token, [200, 429])
  await assertChat(token)

  console.log('Authenticated smoke checks passed')
}

main().catch((err) => {
  console.error(`Authenticated smoke failed: ${err.message}`)
  process.exit(1)
})