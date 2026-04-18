/**
 * Smoke test — Tool Reservation state machine
 *
 * Covers all 10 state-machine cases:
 *   A  pending → cancel (borrower)              → 200 cancelled
 *   B  pending → cancel (owner)                 → 403 FORBIDDEN
 *   C  pending → reject (owner)                 → 200 rejected
 *   D  pending → approve → return (borrower)    → 200 returned
 *   E  approved → cancel (borrower)             → 200 cancelled
 *   F  approved → cancel (owner)                → 200 cancelled
 *   G  approved → return (owner)                → 403 FORBIDDEN
 *   H  terminal → approve                       → 422 RESERVATION_ALREADY_TERMINAL
 *   I  reserve own tool                         → 422 CANNOT_RESERVE_OWN_TOOL
 *   J  duplicate active reservation             → 409 DUPLICATE_RESERVATION
 *
 * Required env vars:
 *   SMOKE_BASE_URL            (default: http://127.0.0.1:3000)
 *   SMOKE_AUTH_EMAIL          borrower email
 *   SMOKE_AUTH_PASSWORD       borrower password
 *   SMOKE_AUTH_OWNER_EMAIL    owner email
 *   SMOKE_AUTH_OWNER_PASSWORD owner password
 *   SMOKE_AUTH_STRICT         if "true" → exit 1 on skip (for CI)
 */

const BASE_URL  = process.env.SMOKE_BASE_URL           || 'http://127.0.0.1:3000'
const B_EMAIL   = process.env.SMOKE_AUTH_EMAIL         || ''
const B_PASS    = process.env.SMOKE_AUTH_PASSWORD      || ''
const O_EMAIL   = process.env.SMOKE_AUTH_OWNER_EMAIL   || ''
const O_PASS    = process.env.SMOKE_AUTH_OWNER_PASSWORD || ''
const STRICT    = process.env.SMOKE_AUTH_STRICT === 'true'
const MAX_LOGIN_RETRIES = Math.max(1, Number(process.env.SMOKE_AUTH_LOGIN_RETRIES || '3'))

// ─── Utilities ────────────────────────────────────────────────────────────────

function fullUrl(path) { return `${BASE_URL}${path}` }

function fail(message) { throw new Error(message) }

function authHeaders(token) {
  return { authorization: `Bearer ${token}`, 'content-type': 'application/json' }
}

function delay(ms) { return new Promise((r) => setTimeout(r, ms)) }

function parseRetryAfterMs(value) {
  if (!value) return null
  const secs = Number(value)
  if (Number.isFinite(secs) && secs > 0) return secs * 1000
  const dateTs = Date.parse(value)
  if (!Number.isNaN(dateTs)) { const diff = dateTs - Date.now(); return diff > 0 ? diff : null }
  return null
}

function assertStatus(actual, expected, context) {
  if (actual !== expected) fail(`${context}: expected HTTP ${expected}, got ${actual}`)
  console.log(`  OK  ${context}`)
}

function assertBodyStatus(body, expectedStatus, context) {
  const actual = body?.data?.status
  if (actual !== expectedStatus) fail(`${context}: expected status '${expectedStatus}', got '${actual}'`)
  console.log(`  OK  ${context} → status='${actual}'`)
}

function assertBodyError(body, expectedError, context) {
  const actual = body?.error
  if (actual !== expectedError) fail(`${context}: expected error '${expectedError}', got '${actual}'`)
  console.log(`  OK  ${context} → error='${actual}'`)
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function login(email, password, label) {
  for (let attempt = 0; attempt < MAX_LOGIN_RETRIES; attempt++) {
    const forwardedFor = label === 'Owner'
      ? `127.0.0.${60 + attempt}`
      : `127.0.0.${70 + attempt}`

    const res = await fetch(fullUrl('/api/auth/login'), {
      method:  'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': forwardedFor },
      body:    JSON.stringify({ email, password }),
    })
    const body = await res.json().catch(() => null)

    if (res.status === 429 && attempt < MAX_LOGIN_RETRIES - 1) {
      const wait = parseRetryAfterMs(res.headers.get('retry-after'))
      await delay(wait ?? 1000 * 2 ** attempt)
      continue
    }

    if (!res.ok) fail(`${label} login failed ${res.status}: ${body?.error ?? 'LOGIN_FAILED'}`)

    const token  = body?.data?.accessToken
    const userId = body?.data?.user?.id
    if (!token || !userId) fail(`${label} login: missing token/userId`)

    return { token, userId }
  }
  fail(`${label} login failed after ${MAX_LOGIN_RETRIES} retries`)
}

// ─── Tool bootstrap ───────────────────────────────────────────────────────────

async function getOrCreateOwnerTool(ownerToken, ownerId) {
  // Try to reuse an existing available tool owned by this user
  const res = await fetch(fullUrl('/api/tools?status=available&limit=50'))
  if (!res.ok) fail(`Failed to fetch tools list: ${res.status}`)
  const body = await res.json().catch(() => null)
  const existing = (body?.data ?? []).find((t) => t.ownerId === ownerId)
  if (existing) {
    console.log(`  Using existing tool: ${existing.id} (${existing.title})`)
    return existing
  }

  // Create a new tool as fallback
  console.log('  No available owner tool found — creating fallback tool for smoke run...')
  const unique = Date.now()
  const create = await fetch(fullUrl('/api/tools'), {
    method:  'POST',
    headers: authHeaders(ownerToken),
    body:    JSON.stringify({
      title:       `Smoke Tool ${unique}`,
      description: 'Temporary tool for reservation smoke validation.',
      condition:   'good',
    }),
  })
  const createBody = await create.json().catch(() => null)
  if (!create.ok) fail(`Failed to create fallback tool: ${create.status} ${createBody?.error ?? ''}`)
  const tool = createBody?.data
  if (!tool?.id) fail('Fallback tool created but id is missing')
  console.log(`  Created fallback tool: ${tool.id} (${tool.title})`)
  return tool
}

// ─── Reservation helpers ──────────────────────────────────────────────────────

function makeDates() {
  // start = tomorrow, end = 8 days from now
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const end   = new Date(Date.now() + 8  * 24 * 60 * 60 * 1000)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate:   end.toISOString().slice(0, 10),
  }
}

/** Creates a reservation and returns the reservation id; throws on failure. */
async function createReservation(borrowerToken, toolId) {
  const res = await fetch(fullUrl('/api/tool-reservations'), {
    method:  'POST',
    headers: authHeaders(borrowerToken),
    body:    JSON.stringify({ toolId, ...makeDates() }),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) fail(`createReservation failed: ${res.status} ${body?.error ?? ''}`)
  const id = body?.data?.id
  if (!id) fail('createReservation: missing id in response')
  return id
}

/** Creates a reservation and returns { status, body } without throwing — for negative tests. */
async function tryCreateReservation(token, toolId) {
  const res = await fetch(fullUrl('/api/tool-reservations'), {
    method:  'POST',
    headers: authHeaders(token),
    body:    JSON.stringify({ toolId, ...makeDates() }),
  })
  const body = await res.json().catch(() => null)
  return { status: res.status, body }
}

/** PATCHes a reservation and returns { status, body } — never throws. */
async function patchReservation(token, id, action, cancellationReason) {
  const payload = { action }
  if (cancellationReason) payload.cancellationReason = cancellationReason

  const res = await fetch(fullUrl(`/api/tool-reservations/${id}`), {
    method:  'PATCH',
    headers: authHeaders(token),
    body:    JSON.stringify(payload),
  })
  const body = await res.json().catch(() => null)
  return { status: res.status, body }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nTool-reservation transition smoke against ${BASE_URL}`)

  if (!B_EMAIL || !B_PASS) {
    const msg = 'Missing borrower credentials: SMOKE_AUTH_EMAIL / SMOKE_AUTH_PASSWORD'
    if (STRICT) fail(msg)
    console.log(`Skipping: ${msg}`)
    return
  }

  if (!O_EMAIL || !O_PASS) {
    const msg = 'Missing owner credentials: SMOKE_AUTH_OWNER_EMAIL / SMOKE_AUTH_OWNER_PASSWORD'
    if (STRICT) fail(msg)
    console.log(`Skipping: ${msg}`)
    return
  }

  const borrower = await login(B_EMAIL, B_PASS, 'Borrower')
  const owner    = await login(O_EMAIL, O_PASS, 'Owner')

  if (borrower.userId === owner.userId) {
    fail('Borrower and owner must be different users')
  }

  const tool = await getOrCreateOwnerTool(owner.token, owner.userId)
  const toolId = tool.id

  let terminalId // used for Case H

  // ── Case A: borrower cancels pending ──────────────────────────────────────
  console.log('\nCase A: pending → cancel (borrower)')
  {
    const id  = await createReservation(borrower.token, toolId)
    const res = await patchReservation(borrower.token, id, 'cancel', 'Borrower cancels own pending')
    assertStatus(res.status, 200, 'A: borrower cancels pending')
    assertBodyStatus(res.body, 'cancelled', 'A: status is cancelled')
  }

  // ── Case B: owner cannot cancel pending ───────────────────────────────────
  console.log('\nCase B: pending → cancel (owner) → 403')
  {
    const id      = await createReservation(borrower.token, toolId)
    const attempt = await patchReservation(owner.token, id, 'cancel', 'Owner tries to cancel pending')
    assertStatus(attempt.status, 403, 'B: owner cannot cancel pending')
    assertBodyError(attempt.body, 'FORBIDDEN', 'B: error is FORBIDDEN')
    // cleanup — borrower cancels so toolId stays unblocked
    await patchReservation(borrower.token, id, 'cancel', 'cleanup after B')
  }

  // ── Case C: owner rejects pending ─────────────────────────────────────────
  console.log('\nCase C: pending → reject (owner)')
  {
    const id  = await createReservation(borrower.token, toolId)
    const res = await patchReservation(owner.token, id, 'reject')
    assertStatus(res.status, 200, 'C: owner rejects pending')
    assertBodyStatus(res.body, 'rejected', 'C: status is rejected')
    terminalId = id // reuse in Case H
  }

  // ── Case D: approve → return (borrower) ───────────────────────────────────
  console.log('\nCase D: pending → approve → return (borrower)')
  {
    const id       = await createReservation(borrower.token, toolId)
    const approve  = await patchReservation(owner.token, id, 'approve')
    assertStatus(approve.status, 200, 'D: owner approves')
    assertBodyStatus(approve.body, 'approved', 'D: status is approved')
    const returned = await patchReservation(borrower.token, id, 'return')
    assertStatus(returned.status, 200, 'D: borrower returns')
    assertBodyStatus(returned.body, 'returned', 'D: status is returned')
  }

  // ── Case E: approved → cancel (borrower) ──────────────────────────────────
  console.log('\nCase E: approved → cancel (borrower)')
  {
    const id      = await createReservation(borrower.token, toolId)
    await patchReservation(owner.token, id, 'approve')
    const cancel  = await patchReservation(borrower.token, id, 'cancel', 'Borrower cancels approved')
    assertStatus(cancel.status, 200, 'E: borrower cancels approved')
    assertBodyStatus(cancel.body, 'cancelled', 'E: status is cancelled')
  }

  // ── Case F: approved → cancel (owner) ─────────────────────────────────────
  console.log('\nCase F: approved → cancel (owner)')
  {
    const id      = await createReservation(borrower.token, toolId)
    await patchReservation(owner.token, id, 'approve')
    const cancel  = await patchReservation(owner.token, id, 'cancel', 'Owner cancels approved')
    assertStatus(cancel.status, 200, 'F: owner cancels approved')
    assertBodyStatus(cancel.body, 'cancelled', 'F: status is cancelled')
  }

  // ── Case G: approved → return (owner) → 403 ───────────────────────────────
  console.log('\nCase G: approved → return (owner) → 403')
  {
    const id      = await createReservation(borrower.token, toolId)
    await patchReservation(owner.token, id, 'approve')
    const attempt = await patchReservation(owner.token, id, 'return')
    assertStatus(attempt.status, 403, 'G: owner cannot mark returned')
    assertBodyError(attempt.body, 'FORBIDDEN', 'G: error is FORBIDDEN')
    // cleanup
    await patchReservation(borrower.token, id, 'return')
  }

  // ── Case H: terminal state → any action → 422 ─────────────────────────────
  console.log('\nCase H: terminal → approve → 422')
  {
    // terminalId was rejected in Case C
    const attempt = await patchReservation(owner.token, terminalId, 'approve')
    assertStatus(attempt.status, 422, 'H: terminal reservation rejects further actions')
    assertBodyError(attempt.body, 'RESERVATION_ALREADY_TERMINAL', 'H: error is RESERVATION_ALREADY_TERMINAL')
  }

  // ── Case I: reserve own tool → 422 ────────────────────────────────────────
  console.log('\nCase I: reserve own tool → 422')
  {
    const attempt = await tryCreateReservation(owner.token, toolId)
    assertStatus(attempt.status, 422, 'I: owner cannot reserve own tool')
    assertBodyError(attempt.body, 'CANNOT_RESERVE_OWN_TOOL', 'I: error is CANNOT_RESERVE_OWN_TOOL')
  }

  // ── Case J: duplicate active reservation → 409 ────────────────────────────
  console.log('\nCase J: duplicate active reservation → 409')
  {
    const id      = await createReservation(borrower.token, toolId)
    const dup     = await tryCreateReservation(borrower.token, toolId)
    assertStatus(dup.status, 409, 'J: duplicate reservation rejected')
    assertBodyError(dup.body, 'DUPLICATE_RESERVATION', 'J: error is DUPLICATE_RESERVATION')
    // cleanup
    await patchReservation(borrower.token, id, 'cancel', 'cleanup after J')
  }

  console.log('\n✓ All tool-reservation transition smoke checks passed\n')
}

main().catch((err) => {
  console.error(`\nTool-reservation smoke FAILED: ${err.message}\n`)
  process.exit(1)
})
