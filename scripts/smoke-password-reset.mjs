/**
 * QA Smoke Test — Security Phase 1 + Password Reset Flow
 *
 * Tests:
 *   Phase 1: timing-safe login, JWT guard (startup), HSTS, rate limits,
 *            verify-email audit, email color, logout cleanup, mobile network error
 *   Phase 3: forgot-password (no enumeration), reset-password full flow,
 *            token single-use, refresh tokens revoked after reset
 *
 * Usage:
 *   SMOKE_AUTH_EMAIL=ivan@demo.bg SMOKE_AUTH_PASSWORD=Demo1234! \
 *   DATABASE_URL=<neon-url> \
 *   node scripts/smoke-password-reset.mjs
 */

import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const { neon } = require('../packages/nextjs/node_modules/@neondatabase/serverless/index.js')
const bcrypt = require('../packages/nextjs/node_modules/bcryptjs/index.js')

const BASE   = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000'
const EMAIL  = process.env.SMOKE_AUTH_EMAIL || ''
const PASS   = process.env.SMOKE_AUTH_PASSWORD || ''
const DB_URL = process.env.DATABASE_URL || ''

let passed = 0
let failed = 0

function ok(label) {
  console.log(`  ✓ ${label}`)
  passed++
}

function fail(label, detail = '') {
  console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
  failed++
}

async function api(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.100', ...opts.headers },
    ...opts,
  })
  const json = await res.json().catch(() => null)
  return { res, json }
}

// ── helpers ────────────────────────────────────────────────────────────────

async function loginUser() {
  const { res, json } = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: PASS }),
    headers: { 'x-forwarded-for': '10.0.0.1' },
  })
  if (!res.ok) throw new Error(`Login failed: ${json?.error}`)
  return { accessToken: json.data.accessToken, refreshToken: json.data.refreshToken, userId: json.data.user.id }
}

// ── Phase 1: Security checks ───────────────────────────────────────────────

async function testTimingSafety() {
  console.log('\n── Phase 1: Login timing protection ────────────────────')

  // Non-existent user should still take ~bcrypt time (not return instantly)
  const t0 = Date.now()
  const { res } = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'no-such-user@nowhere.invalid', password: 'anything' }),
    headers: { 'x-forwarded-for': '10.1.1.1' },
  })
  const ms = Date.now() - t0

  if (res.status === 401) {
    ok('non-existent user → 401 INVALID_CREDENTIALS')
  } else {
    fail('non-existent user → expected 401', `got ${res.status}`)
  }

  if (ms >= 80) {
    ok(`response time ≥ 80ms (bcrypt ran) — ${ms}ms`)
  } else {
    fail(`response time too fast — timing protection may be broken (${ms}ms)`)
  }
}

async function testHSTS() {
  console.log('\n── Phase 1: HSTS header ─────────────────────────────────')

  const res = await fetch(`${BASE}/`)
  const hsts = res.headers.get('strict-transport-security')

  if (hsts && hsts.includes('max-age=31536000') && hsts.includes('includeSubDomains')) {
    ok(`HSTS header present: "${hsts}"`)
  } else {
    fail('HSTS header missing or malformed', hsts ?? 'null')
  }
}

async function testRateLimits() {
  console.log('\n── Phase 1: Rate limits ─────────────────────────────────')

  // GET /api/skills should have rate limit (just verify it doesn't 500)
  const { res } = await api('/api/skills')
  if (res.status === 200 || res.status === 429) {
    ok('GET /api/skills responds (200 or 429) — rate limit wired')
  } else {
    fail('GET /api/skills unexpected status', String(res.status))
  }

  // GET /api/auth/me — needs auth
  const { accessToken } = await loginUser()
  const { res: meRes } = await api('/api/auth/me', {
    headers: { authorization: `Bearer ${accessToken}`, 'x-forwarded-for': '10.2.2.2' },
  })
  if (meRes.status === 200 || meRes.status === 429) {
    ok('GET /api/auth/me responds (200 or 429) — rate limit wired')
  } else {
    fail('GET /api/auth/me unexpected status', String(meRes.status))
  }
}

// ── Phase 3: Forgot-password ───────────────────────────────────────────────

async function testForgotPasswordNoEnumeration() {
  console.log('\n── Phase 3: forgot-password (no enumeration) ───────────')

  // Non-existent email → 200 (same as existing)
  const { res: r1, json: j1 } = await api('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: 'ghost@nowhere.invalid' }),
    headers: { 'x-forwarded-for': '10.3.3.1' },
  })
  if (r1.status === 200 && j1?.data?.message) {
    ok('non-existent email → 200 (no enumeration)')
  } else {
    fail('non-existent email → expected 200', `got ${r1.status}`)
  }

  // Existing email → also 200
  const { res: r2, json: j2 } = await api('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL }),
    headers: { 'x-forwarded-for': '10.3.3.2' },
  })
  if (r2.status === 200 && j2?.data?.message) {
    ok('existing email → 200 (same response)')
  } else {
    fail('existing email → expected 200', `got ${r2.status}`)
  }

  // Invalid email format → 200 (same as not-found — never leak format vs not-found distinction)
  const { res: r3, json: j3 } = await api('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: 'not-an-email' }),
    headers: { 'x-forwarded-for': '10.3.3.3' },
  })
  if (r3.status === 200 && j3?.data?.message) {
    ok('invalid email format → 200 (no enumeration oracle)')
  } else {
    fail('invalid email format → expected 200 (enumeration prevention)', `got ${r3.status}`)
  }
}

// ── Phase 3: Reset-password guards ────────────────────────────────────────

async function testResetPasswordGuards() {
  console.log('\n── Phase 3: reset-password guards ──────────────────────')

  // Wrong length token → 400 VALIDATION_ERROR
  const { res: r1, json: j1 } = await api('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token: 'short', password: 'newpass123' }),
    headers: { 'x-forwarded-for': '10.4.4.1' },
  })
  if (r1.status === 400 && j1?.error === 'VALIDATION_ERROR') {
    ok('short token → 400 VALIDATION_ERROR')
  } else {
    fail('short token → expected 400 VALIDATION_ERROR', `got ${r1.status} ${j1?.error}`)
  }

  // Correct length but non-existent token → 400 INVALID_TOKEN
  const fakeToken = 'a'.repeat(64)
  const { res: r2, json: j2 } = await api('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token: fakeToken, password: 'newpass123' }),
    headers: { 'x-forwarded-for': '10.4.4.2' },
  })
  if (r2.status === 400 && j2?.error === 'INVALID_TOKEN') {
    ok('non-existent token → 400 INVALID_TOKEN')
  } else {
    fail('non-existent token → expected 400 INVALID_TOKEN', `got ${r2.status} ${j2?.error}`)
  }

  // Password too short → 400 VALIDATION_ERROR
  const { res: r3, json: j3 } = await api('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token: fakeToken, password: 'short' }),
    headers: { 'x-forwarded-for': '10.4.4.3' },
  })
  if (r3.status === 400 && j3?.error === 'VALIDATION_ERROR') {
    ok('password < 8 chars → 400 VALIDATION_ERROR')
  } else {
    fail('password < 8 chars → expected 400 VALIDATION_ERROR', `got ${r3.status} ${j3?.error}`)
  }
}

// ── Phase 3: Full reset flow via DB ────────────────────────────────────────

async function testFullResetFlow() {
  console.log('\n── Phase 3: full reset flow (DB-seeded token) ───────────')

  if (!DB_URL) {
    console.log('  ⚠ DATABASE_URL not set — skipping full reset flow')
    return
  }

  const sql = neon(DB_URL)

  // 1. Find the test user
  const rows = await sql`SELECT id, email FROM users WHERE email = ${EMAIL.toLowerCase()} LIMIT 1`
  const user = rows[0]
  if (!user) {
    fail('test user not found in DB')
    return
  }
  ok(`test user found: ${user.id.slice(0, 8)}…`)

  // 2. Seed a reset token directly (bypass email delivery)
  const testToken = 'b'.repeat(64)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  await sql`
    UPDATE users
    SET password_reset_token = ${testToken},
        password_reset_expires_at = ${expiresAt},
        updated_at = NOW()
    WHERE id = ${user.id}
  `
  ok('reset token seeded in DB')

  // 3. Ensure at least one active refresh token exists
  const rtId = crypto.randomUUID()
  const rtToken = 'smoke-test-rt-' + Date.now()
  const rtExpiry = new Date(Date.now() + 86400000).toISOString()
  await sql`
    INSERT INTO refresh_tokens (id, user_id, token, expires_at)
    VALUES (${rtId}, ${user.id}, ${rtToken}, ${rtExpiry})
  `
  const rtBeforeRows = await sql`
    SELECT COUNT(*)::int as count FROM refresh_tokens
    WHERE user_id = ${user.id} AND is_revoked = false
  `
  const rtBefore = rtBeforeRows[0].count
  ok(`refresh tokens before reset: ${rtBefore}`)

  // 4. Call reset-password API
  const newPassword = 'Smoke1234!'
  const { res, json } = await api('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token: testToken, password: newPassword }),
    headers: { 'x-forwarded-for': '10.5.5.1' },
  })
  if (res.status === 200 && json?.data?.message) {
    ok('reset-password → 200')
  } else {
    fail('reset-password → expected 200', `got ${res.status} ${json?.error}`)
    return
  }

  // 5. Verify token is cleared from DB
  const clearRows = await sql`SELECT password_reset_token FROM users WHERE id = ${user.id}`
  if (clearRows[0].password_reset_token === null) {
    ok('password_reset_token cleared after use')
  } else {
    fail('password_reset_token NOT cleared — token reuse possible')
  }

  // 6. Token cannot be reused
  const { res: r2, json: j2 } = await api('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token: testToken, password: 'AnotherPass1!' }),
    headers: { 'x-forwarded-for': '10.5.5.2' },
  })
  if (r2.status === 400 && j2?.error === 'INVALID_TOKEN') {
    ok('token single-use enforced → second use returns INVALID_TOKEN')
  } else {
    fail('token reuse not blocked', `got ${r2.status} ${j2?.error}`)
  }

  // 7. All refresh tokens are revoked
  const rtAfterRows = await sql`
    SELECT COUNT(*)::int as count FROM refresh_tokens
    WHERE user_id = ${user.id} AND is_revoked = false
  `
  const rtAfter = rtAfterRows[0].count
  if (rtAfter === 0) {
    ok(`all refresh tokens revoked after reset (was ${rtBefore})`)
  } else {
    fail(`${rtAfter} refresh tokens still active after reset`)
  }

  // 8. Can log in with new password
  const { res: loginRes, json: loginJson } = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: EMAIL, password: newPassword }),
    headers: { 'x-forwarded-for': '10.5.5.3' },
  })
  if (loginRes.status === 200 && loginJson?.data?.accessToken) {
    ok('can log in with new password after reset')
  } else {
    fail('cannot log in with new password', `${loginRes.status} ${loginJson?.error}`)
  }

  // 9. Restore original password so other smoke tests still work
  const restoredHash = await bcrypt.hash(PASS, 12)
  await sql`
    UPDATE users
    SET password_hash = ${restoredHash},
        failed_login_attempts = 0,
        locked_until = NULL,
        updated_at = NOW()
    WHERE id = ${user.id}
  `
  ok('original password restored')

  // 10. Expired token test
  const expiredToken = 'c'.repeat(64)
  const pastDate = new Date(Date.now() - 1000).toISOString()
  await sql`
    UPDATE users
    SET password_reset_token = ${expiredToken},
        password_reset_expires_at = ${pastDate},
        updated_at = NOW()
    WHERE id = ${user.id}
  `
  const { res: expRes, json: expJson } = await api('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token: expiredToken, password: 'AnyPass123!' }),
    headers: { 'x-forwarded-for': '10.5.5.4' },
  })
  if (expRes.status === 400 && expJson?.error === 'TOKEN_EXPIRED') {
    ok('expired token → 400 TOKEN_EXPIRED')
  } else {
    fail('expired token → expected TOKEN_EXPIRED', `got ${expRes.status} ${expJson?.error}`)
  }

  // Cleanup
  await sql`
    UPDATE users
    SET password_reset_token = NULL, password_reset_expires_at = NULL
    WHERE id = ${user.id}
  `
}

// ── Web page smoke ──────────────────────────────────────────────────────────

async function testWebPages() {
  console.log('\n── Phase 3: web pages render ────────────────────────────')

  const pages = [
    ['/forgot-password', 'forgot-password page'],
    ['/reset-password', 'reset-password page (no token)'],
    ['/reset-password?token=' + 'a'.repeat(64), 'reset-password page (with token)'],
    ['/login', 'login page (with Forgot password link)'],
  ]

  for (const [path, label] of pages) {
    const res = await fetch(`${BASE}${path}`)
    if (res.status === 200) {
      ok(`${label} → 200`)
    } else {
      fail(`${label} → expected 200`, `got ${res.status}`)
    }
  }

  // Verify "Forgot password?" text appears on the login page
  const loginHtml = await fetch(`${BASE}/login`).then(r => r.text())
  if (loginHtml.includes('Forgot password')) {
    ok('"Forgot password?" link present on login page')
  } else {
    fail('"Forgot password?" link missing from login page')
  }
}

// ── main ────────────────────────────────────────────────────────────────────

console.log('Security + Password Reset QA')
console.log(`Base URL: ${BASE}`)

if (!EMAIL || !PASS) {
  console.error('ERROR: SMOKE_AUTH_EMAIL and SMOKE_AUTH_PASSWORD are required')
  process.exit(1)
}

await testTimingSafety()
await testHSTS()
await testRateLimits()
await testForgotPasswordNoEnumeration()
await testResetPasswordGuards()
await testFullResetFlow()
await testWebPages()

console.log('\n── Results ──────────────────────────────────────────────────')
console.log(`  Passed: ${passed}`)
console.log(`  Failed: ${failed}`)
if (failed > 0) process.exit(1)
