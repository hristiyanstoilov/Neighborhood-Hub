const BASE_URL = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000'
const REQUESTER_EMAIL = process.env.SMOKE_AUTH_EMAIL || ''
const REQUESTER_PASSWORD = process.env.SMOKE_AUTH_PASSWORD || ''
const OWNER_EMAIL = process.env.SMOKE_AUTH_OWNER_EMAIL || ''
const OWNER_PASSWORD = process.env.SMOKE_AUTH_OWNER_PASSWORD || ''
const STRICT = process.env.SMOKE_AUTH_STRICT === 'true'

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

async function login(email, password, label) {
  const res = await fetch(fullUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const body = await res.json().catch(() => null)
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

async function getAvailableOwnerSkill(ownerId) {
  const res = await fetch(fullUrl('/api/skills?status=available&limit=50'))
  if (!res.ok) {
    fail(`Failed to fetch skills list: ${res.status}`)
  }

  const body = await res.json().catch(() => null)
  const skills = body?.data ?? []
  const skill = skills.find((row) => row.ownerId === ownerId)

  if (!skill) {
    fail('No available skill found for owner account. Cannot run transition smoke.')
  }

  return skill
}

function makeMeetingPayload(skillId) {
  const start = new Date(Date.now() + 2 * 60 * 60 * 1000)
  const end = new Date(start.getTime() + 60 * 60 * 1000)

  return {
    skillId,
    scheduledStart: start.toISOString(),
    scheduledEnd: end.toISOString(),
    meetingType: 'online',
    meetingUrl: 'https://meet.example.com/neighborhood-hub-smoke',
    notes: 'Smoke transition check',
  }
}

async function createRequest(requesterToken, skillId) {
  const res = await fetch(fullUrl('/api/skill-requests'), {
    method: 'POST',
    headers: authHeaders(requesterToken),
    body: JSON.stringify(makeMeetingPayload(skillId)),
  })

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    fail(`Failed creating skill request: ${res.status} ${body?.error ?? ''}`.trim())
  }

  const requestId = body?.data?.id
  if (!requestId) {
    fail('Create request succeeded but request id is missing')
  }

  return requestId
}

async function patchRequest(token, requestId, action, cancellationReason) {
  const payload = { action }
  if (cancellationReason) payload.cancellationReason = cancellationReason

  const res = await fetch(fullUrl(`/api/skill-requests/${requestId}`), {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  })

  const body = await res.json().catch(() => null)
  return { status: res.status, body }
}

function assertStatus(actual, expected, context) {
  if (actual !== expected) {
    fail(`${context}: expected ${expected}, got ${actual}`)
  }
  console.log(`OK ${context} -> ${actual}`)
}

function assertRequestStatus(body, expectedStatus, context) {
  const actual = body?.data?.status
  if (actual !== expectedStatus) {
    fail(`${context}: expected status '${expectedStatus}', got '${actual}'`)
  }
  console.log(`OK ${context} status='${actual}'`)
}

async function main() {
  console.log(`Running skill-request transition smoke against ${BASE_URL}`)

  if (!REQUESTER_EMAIL || !REQUESTER_PASSWORD) {
    const message = 'Missing requester credentials: SMOKE_AUTH_EMAIL / SMOKE_AUTH_PASSWORD'
    if (STRICT) fail(message)
    console.log(`Skipping transition smoke: ${message}`)
    return
  }

  if (!OWNER_EMAIL || !OWNER_PASSWORD) {
    const message = 'Missing owner credentials: SMOKE_AUTH_OWNER_EMAIL / SMOKE_AUTH_OWNER_PASSWORD'
    if (STRICT) fail(message)
    console.log(`Skipping transition smoke: ${message}`)
    return
  }

  const requester = await login(REQUESTER_EMAIL, REQUESTER_PASSWORD, 'Requester')
  const owner = await login(OWNER_EMAIL, OWNER_PASSWORD, 'Owner')

  if (requester.userId === owner.userId) {
    fail('Requester and owner credentials must belong to different users')
  }

  const skill = await getAvailableOwnerSkill(owner.userId)
  console.log(`Using owner skill: ${skill.id} (${skill.title})`)

  // Case 1: pending -> cancelled only requester
  const reqPendingCancel = await createRequest(requester.token, skill.id)

  const ownerCancelPending = await patchRequest(owner.token, reqPendingCancel, 'cancel', 'Owner tries pending cancel')
  assertStatus(ownerCancelPending.status, 403, 'owner cannot cancel pending')

  const requesterCancelPending = await patchRequest(requester.token, reqPendingCancel, 'cancel', 'Requester cancels pending')
  assertStatus(requesterCancelPending.status, 200, 'requester cancels pending')
  assertRequestStatus(requesterCancelPending.body, 'cancelled', 'requester cancels pending')

  // Case 2: accepted -> completed only requester
  const reqComplete = await createRequest(requester.token, skill.id)

  const ownerAccept = await patchRequest(owner.token, reqComplete, 'accept')
  assertStatus(ownerAccept.status, 200, 'owner accepts pending')
  assertRequestStatus(ownerAccept.body, 'accepted', 'owner accepts pending')

  const ownerComplete = await patchRequest(owner.token, reqComplete, 'complete')
  assertStatus(ownerComplete.status, 403, 'owner cannot complete accepted')

  const requesterComplete = await patchRequest(requester.token, reqComplete, 'complete')
  assertStatus(requesterComplete.status, 200, 'requester completes accepted')
  assertRequestStatus(requesterComplete.body, 'completed', 'requester completes accepted')

  // Case 3: accepted -> cancelled by owner
  const reqOwnerCancelAccepted = await createRequest(requester.token, skill.id)

  const ownerAccept2 = await patchRequest(owner.token, reqOwnerCancelAccepted, 'accept')
  assertStatus(ownerAccept2.status, 200, 'owner accepts for owner-cancel case')

  const ownerCancelAccepted = await patchRequest(owner.token, reqOwnerCancelAccepted, 'cancel', 'Owner cancels accepted')
  assertStatus(ownerCancelAccepted.status, 200, 'owner cancels accepted')
  assertRequestStatus(ownerCancelAccepted.body, 'cancelled', 'owner cancels accepted')

  // Case 4: accepted -> cancelled by requester
  const reqRequesterCancelAccepted = await createRequest(requester.token, skill.id)

  const ownerAccept3 = await patchRequest(owner.token, reqRequesterCancelAccepted, 'accept')
  assertStatus(ownerAccept3.status, 200, 'owner accepts for requester-cancel case')

  const requesterCancelAccepted = await patchRequest(requester.token, reqRequesterCancelAccepted, 'cancel', 'Requester cancels accepted')
  assertStatus(requesterCancelAccepted.status, 200, 'requester cancels accepted')
  assertRequestStatus(requesterCancelAccepted.body, 'cancelled', 'requester cancels accepted')

  console.log('Skill-request transition smoke checks passed')
}

main().catch((err) => {
  console.error(`Skill-request transition smoke failed: ${err.message}`)
  process.exit(1)
})
