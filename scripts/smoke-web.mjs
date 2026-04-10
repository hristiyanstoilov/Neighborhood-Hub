const BASE_URL = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000'

function fullUrl(path) {
  return `${BASE_URL}${path}`
}

async function request(path, options = {}) {
  const res = await fetch(fullUrl(path), {
    redirect: 'manual',
    ...options,
  })

  const text = await res.text()
  return { res, text }
}

function fail(message) {
  throw new Error(message)
}

async function assertStatus(path, expected) {
  const { res } = await request(path)
  if (res.status !== expected) {
    fail(`Expected ${path} -> ${expected}, got ${res.status}`)
  }
  console.log(`OK status ${path} -> ${expected}`)
}

async function assertEventualLogin(path, expectedFragment) {
  const { res, text } = await request(path)

  if ([303, 307, 308].includes(res.status)) {
    const location = res.headers.get('location') || ''
    if (!location.includes(expectedFragment)) {
      fail(`Expected redirect for ${path} to include '${expectedFragment}', got '${location}'`)
    }
    console.log(`OK redirect ${path} -> ${location}`)
    return
  }

  if (res.status === 200 && text.includes(expectedFragment)) {
    console.log(`OK eventual-login body ${path}`)
    return
  }

  fail(`Expected ${path} to resolve to login flow, got status ${res.status}`)
}

async function assertApiStatus(path, expected, options) {
  const { res, text } = await request(path, options)
  if (res.status !== expected) {
    fail(`Expected API ${path} -> ${expected}, got ${res.status}. Body: ${text.slice(0, 180)}`)
  }
  console.log(`OK api ${path} -> ${expected}`)
}

async function assertSecurityHeaders() {
  const { res } = await request('/login')
  const checks = [
    ['x-frame-options', 'DENY'],
    ['x-content-type-options', 'nosniff'],
    ['referrer-policy', 'strict-origin-when-cross-origin'],
  ]

  for (const [key, expected] of checks) {
    const value = res.headers.get(key)
    if (value !== expected) {
      fail(`Expected header ${key}='${expected}', got '${value}'`)
    }
  }

  const csp = res.headers.get('content-security-policy') || ''
  if (!csp.includes("default-src 'self'")) {
    fail('Expected content-security-policy to include default-src self')
  }

  console.log('OK security headers on /login')
}

async function main() {
  console.log(`Running smoke checks against ${BASE_URL}`)

  await assertStatus('/', 200)
  await assertStatus('/skills', 200)
  await assertStatus('/login', 200)
  await assertStatus('/register', 200)

  await assertEventualLogin('/admin', '/login?next=/admin')
  await assertEventualLogin('/profile/edit', '/login?next=/profile/edit')
  await assertEventualLogin('/my-requests', '/login?next=/my-requests')
  await assertEventualLogin('/chat', '/login?next=/chat')

  await assertApiStatus('/api/profile', 401)
  await assertApiStatus('/api/notifications', 401)
  await assertApiStatus('/api/ai/recommendations?limit=5', 401)
  await assertApiStatus('/api/auth/refresh', 401, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  })

  await assertSecurityHeaders()

  console.log('All smoke checks passed')
}

main().catch((err) => {
  console.error(`Smoke failed: ${err.message}`)
  process.exit(1)
})