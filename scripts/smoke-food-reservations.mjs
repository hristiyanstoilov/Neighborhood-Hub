const BASE_URL = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000'
const REQUESTER_EMAIL = process.env.SMOKE_AUTH_EMAIL || ''
const REQUESTER_PASSWORD = process.env.SMOKE_AUTH_PASSWORD || ''
const OWNER_EMAIL = process.env.SMOKE_AUTH_OWNER_EMAIL || ''
const OWNER_PASSWORD = process.env.SMOKE_AUTH_OWNER_PASSWORD || ''
const STRICT = process.env.SMOKE_AUTH_STRICT === 'true'
const MAX_LOGIN_RETRIES = Math.max(1, Number(process.env.SMOKE_AUTH_LOGIN_RETRIES || '3'))

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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseRetryAfterMs(value) {
  if (!value) return null
  const secs = Number(value)
  if (Number.isFinite(secs) && secs > 0) return secs * 1000
  const dateTs = Date.parse(value)
  if (!Number.isNaN(dateTs)) {
    const diff = dateTs - Date.now()
    return diff > 0 ? diff : null
  }
  return null
}

async function login(email, password, label) {
  for (let attempt = 0; attempt < MAX_LOGIN_RETRIES; attempt += 1) {
    const forwardedFor = label === 'Owner' ? `127.0.0.${80 + attempt}` : `127.0.0.${90 + attempt}`

    const res = await fetch(fullUrl('/api/auth/login'), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': forwardedFor,
      },
      body: JSON.stringify({ email, password }),
    })

    const body = await res.json().catch(() => null)

    if (res.status === 429 && attempt < MAX_LOGIN_RETRIES - 1) {
      const retryAfterMs = parseRetryAfterMs(res.headers.get('retry-after'))
      await delay(retryAfterMs ?? 1000 * 2 ** attempt)
      continue
    }

    if (!res.ok) {
      fail(`${label} login failed with ${res.status}: ${body?.error ?? 'LOGIN_FAILED'}`)
    }

    const token = body?.data?.accessToken
    const userId = body?.data?.user?.id
    if (!token || !userId) {
      fail(`${label} login succeeded but token/userId is missing`)
    }

    return { token, userId }
  }

  fail(`${label} login failed after retries`)
}

function assertStatus(actual, expected, context) {
  if (actual !== expected) fail(`${context}: expected ${expected}, got ${actual}`)
  console.log(`OK ${context} -> ${actual}`)
}

function assertError(body, expectedError, context) {
  const actual = body?.error
  if (actual !== expectedError) fail(`${context}: expected error '${expectedError}', got '${actual}'`)
  console.log(`OK ${context} error='${actual}'`)
}

function makePickupIso(hoursAhead = 4) {
  return new Date(Date.now() + hoursAhead * 60 * 60 * 1000).toISOString()
}

async function createFood(ownerToken, titleSuffix) {
  const res = await fetch(fullUrl('/api/food-shares'), {
    method: 'POST',
    headers: authHeaders(ownerToken),
    body: JSON.stringify({
      title: `Smoke Food ${titleSuffix}`,
      description: 'Temporary listing for food reservation smoke validation.',
      quantity: 2,
      pickupInstructions: 'Ring once',
    }),
  })

  const body = await res.json().catch(() => null)
  if (!res.ok) fail(`createFood failed: ${res.status} ${body?.error ?? ''}`.trim())
  if (!body?.data?.id) fail('createFood succeeded but id is missing')
  return body.data
}

async function createReservation(requesterToken, foodShareId, notes = 'Smoke reserve') {
  const res = await fetch(fullUrl(`/api/food-shares/${foodShareId}/reservations`), {
    method: 'POST',
    headers: authHeaders(requesterToken),
    body: JSON.stringify({ pickupAt: makePickupIso(), notes }),
  })
  const body = await res.json().catch(() => null)
  return { status: res.status, body }
}

async function patchReservation(token, foodShareId, reservationId, action, cancellationReason) {
  const payload = { action }
  if (cancellationReason) payload.cancellationReason = cancellationReason

  const res = await fetch(fullUrl(`/api/food-shares/${foodShareId}/reservations/${reservationId}`), {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => null)
  return { status: res.status, body }
}

async function cancelReservation(token, foodShareId, reservationId, reason) {
  const res = await fetch(fullUrl(`/api/food-shares/${foodShareId}/reservations/${reservationId}`), {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ action: 'cancel', cancellationReason: reason }),
  })
  const body = await res.json().catch(() => null)
  return { status: res.status, body }
}

async function main() {
  console.log(`Food reservation transition smoke against ${BASE_URL}`)

  if (!REQUESTER_EMAIL || !REQUESTER_PASSWORD) {
    const message = 'Missing requester credentials: SMOKE_AUTH_EMAIL / SMOKE_AUTH_PASSWORD'
    if (STRICT) fail(message)
    console.log(`Skipping: ${message}`)
    return
  }

  if (!OWNER_EMAIL || !OWNER_PASSWORD) {
    const message = 'Missing owner credentials: SMOKE_AUTH_OWNER_EMAIL / SMOKE_AUTH_OWNER_PASSWORD'
    if (STRICT) fail(message)
    console.log(`Skipping: ${message}`)
    return
  }

  const requester = await login(REQUESTER_EMAIL, REQUESTER_PASSWORD, 'Requester')
  const owner = await login(OWNER_EMAIL, OWNER_PASSWORD, 'Owner')

  if (requester.userId === owner.userId) {
    fail('Requester and owner must be different users')
  }

  const foodA = await createFood(owner.token, Date.now())
  console.log(`Using food listing: ${foodA.id}`)

  const reserveA = await createReservation(requester.token, foodA.id)
  assertStatus(reserveA.status, 201, 'requester creates reservation')
  const reservationA = reserveA.body?.data
  if (!reservationA?.id) fail('Reservation id missing after create')

  const ownerApprove = await patchReservation(owner.token, foodA.id, reservationA.id, 'approve')
  assertStatus(ownerApprove.status, 200, 'owner approves pending reservation')

  const ownerPickedUp = await patchReservation(owner.token, foodA.id, reservationA.id, 'picked_up')
  assertStatus(ownerPickedUp.status, 200, 'owner marks picked_up')

  const invalidReApprove = await patchReservation(owner.token, foodA.id, reservationA.id, 'approve')
  assertStatus(invalidReApprove.status, 422, 'cannot approve terminal reservation')
  assertError(invalidReApprove.body, 'INVALID_TRANSITION', 'terminal approve rejected')

  const foodB = await createFood(owner.token, `${Date.now()}-dup`)
  const firstPending = await createReservation(requester.token, foodB.id, 'first pending')
  assertStatus(firstPending.status, 201, 'create first pending reservation')
  const firstPendingId = firstPending.body?.data?.id
  if (!firstPendingId) fail('First pending reservation id missing')

  const duplicatePending = await createReservation(requester.token, foodB.id, 'duplicate pending')
  assertStatus(duplicatePending.status, 409, 'duplicate active reservation rejected')
  assertError(duplicatePending.body, 'DUPLICATE_ACTIVE_RESERVATION', 'duplicate reservation error')

  const ownerCancelsPending = await cancelReservation(owner.token, foodB.id, firstPendingId, 'owner cancel pending')
  assertStatus(ownerCancelsPending.status, 200, 'owner can cancel pending reservation')

  const foodC = await createFood(owner.token, `${Date.now()}-cancel`)
  const cancelByRequester = await createReservation(requester.token, foodC.id, 'requester cancel case')
  assertStatus(cancelByRequester.status, 201, 'create reservation for requester cancel')
  const cancelByRequesterId = cancelByRequester.body?.data?.id
  if (!cancelByRequesterId) fail('Requester cancel reservation id missing')

  const requesterCancel = await cancelReservation(requester.token, foodC.id, cancelByRequesterId, 'requester cancel')
  assertStatus(requesterCancel.status, 200, 'requester cancels pending reservation')

  console.log('Food reservation smoke checks passed')
}

main().catch((err) => {
  console.error(`Food reservation smoke FAILED: ${err.message}`)
  process.exit(1)
})
