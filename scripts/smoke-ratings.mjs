const BASE_URL = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000'
const EMAIL = process.env.SMOKE_AUTH_EMAIL || ''
const PASSWORD = process.env.SMOKE_AUTH_PASSWORD || ''
const STRICT = process.env.SMOKE_AUTH_STRICT === 'true'
const STRICT_RATINGS = process.env.SMOKE_RATINGS_STRICT === 'true'

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

async function login() {
  const res = await fetch(fullUrl('/api/auth/login'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '127.0.0.31',
    },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    fail(`Ratings smoke login failed with ${res.status}: ${body?.error ?? 'LOGIN_FAILED'}`)
  }

  const token = body?.data?.accessToken
  const userId = body?.data?.user?.id

  if (!token || !userId) {
    fail('Ratings smoke login succeeded but accessToken or user.id is missing')
  }

  return { token, userId }
}

async function apiGet(path, token) {
  const res = await fetch(fullUrl(path), {
    headers: {
      authorization: `Bearer ${token}`,
    },
  })
  const json = await res.json().catch(() => null)
  return { res, json }
}

async function assertPublicRatings(userId) {
  const res = await fetch(fullUrl(`/api/ratings?userId=${encodeURIComponent(userId)}&limit=5&offset=0`))
  const json = await res.json().catch(() => null)

  if (!res.ok) {
    fail(`Expected public ratings list -> 200, got ${res.status} (${json?.error ?? 'UNKNOWN_ERROR'})`)
  }

  const rows = Array.isArray(json?.data?.ratings) ? json.data.ratings : null
  if (!rows) {
    fail('Expected public ratings response to include ratings array')
  }

  console.log(`OK ratings list for user ${userId} -> ${rows.length} row(s)`)
  return rows
}

function buildCandidateFromSkillRequest(viewerId, row) {
  if (!row?.id || row?.status !== 'completed') return null
  if (viewerId !== row.userFromId && viewerId !== row.userToId) return null

  const ratedUserId = viewerId === row.userFromId ? row.userToId : row.userFromId
  if (!ratedUserId) return null

  return {
    contextType: 'skill_request',
    contextId: row.id,
    ratedUserId,
  }
}

function buildCandidateFromToolReservation(viewerId, row) {
  if (!row?.id || row?.status !== 'returned') return null
  if (viewerId !== row.borrowerId && viewerId !== row.ownerId) return null

  const ratedUserId = viewerId === row.borrowerId ? row.ownerId : row.borrowerId
  if (!ratedUserId) return null

  return {
    contextType: 'tool_reservation',
    contextId: row.id,
    ratedUserId,
  }
}

function buildCandidateFromFoodReservation(viewerId, row) {
  if (!row?.id || row?.status !== 'picked_up') return null
  if (viewerId !== row.requesterId && viewerId !== row.ownerId) return null

  const ratedUserId = viewerId === row.requesterId ? row.ownerId : row.requesterId
  if (!ratedUserId) return null

  return {
    contextType: 'food_reservation',
    contextId: row.id,
    ratedUserId,
  }
}

async function fetchCandidateContexts(token, viewerId) {
  const [skills, toolsBorrower, toolsOwner, foodRequester, foodOwner] = await Promise.all([
    apiGet('/api/skill-requests?status=completed&page=1&limit=20', token),
    apiGet('/api/tool-reservations?role=borrower', token),
    apiGet('/api/tool-reservations?role=owner', token),
    apiGet('/api/food-reservations?role=requester', token),
    apiGet('/api/food-reservations?role=owner', token),
  ])

  const responses = [skills, toolsBorrower, toolsOwner, foodRequester, foodOwner]
  for (const response of responses) {
    if (!response.res.ok) {
      fail(`Expected context listing endpoint -> 200, got ${response.res.status} (${response.json?.error ?? 'UNKNOWN_ERROR'})`)
    }
  }

  const candidates = []

  for (const row of skills.json?.data ?? []) {
    const candidate = buildCandidateFromSkillRequest(viewerId, row)
    if (candidate) candidates.push(candidate)
  }

  for (const row of [...(toolsBorrower.json?.data ?? []), ...(toolsOwner.json?.data ?? [])]) {
    const candidate = buildCandidateFromToolReservation(viewerId, row)
    if (candidate) candidates.push(candidate)
  }

  for (const row of [...(foodRequester.json?.data ?? []), ...(foodOwner.json?.data ?? [])]) {
    const candidate = buildCandidateFromFoodReservation(viewerId, row)
    if (candidate) candidates.push(candidate)
  }

  return candidates
}

async function hasRated(token, contextType, contextId) {
  const params = new URLSearchParams({ contextType, contextId })
  const { res, json } = await apiGet(`/api/ratings/check?${params.toString()}`, token)

  if (!res.ok) {
    fail(`Expected ratings check -> 200, got ${res.status} (${json?.error ?? 'UNKNOWN_ERROR'})`)
  }

  return Boolean(json?.data?.hasRated)
}

async function submitRating(token, candidate) {
  const res = await fetch(fullUrl('/api/ratings'), {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      contextType: candidate.contextType,
      contextId: candidate.contextId,
      ratedUserId: candidate.ratedUserId,
      score: 5,
      comment: 'CI ratings smoke check',
    }),
  })

  const json = await res.json().catch(() => null)
  if (!res.ok) {
    fail(`Expected ratings create -> 201, got ${res.status} (${json?.error ?? 'UNKNOWN_ERROR'})`)
  }

  console.log(`OK rating created for ${candidate.contextType}:${candidate.contextId}`)
}

async function verifyRatingInList(candidate) {
  const rows = await assertPublicRatings(candidate.ratedUserId)
  const found = rows.some((row) => row.contextType === candidate.contextType && row.contextId === candidate.contextId)

  if (!found) {
    fail(`Expected created rating in rated user's list for ${candidate.contextType}:${candidate.contextId}`)
  }

  console.log('OK created rating visible in public list')
}

async function main() {
  console.log(`Running ratings smoke checks against ${BASE_URL}`)

  if (!EMAIL || !PASSWORD) {
    const message = 'SMOKE_AUTH_EMAIL or SMOKE_AUTH_PASSWORD is not set'
    if (STRICT || STRICT_RATINGS) {
      fail(`Ratings smoke failed: ${message}`)
    }
    console.log(`Skipping ratings smoke: ${message}`)
    return
  }

  const { token, userId } = await login()

  await assertPublicRatings(userId)

  const candidates = await fetchCandidateContexts(token, userId)
  if (candidates.length === 0) {
    const message = 'No terminal contexts available for rating'
    if (STRICT_RATINGS) fail(message)
    console.log(`Skipping create-rating path: ${message}`)
    console.log('Ratings smoke checks passed (read-only path)')
    return
  }

  let selected = null
  for (const candidate of candidates) {
    const rated = await hasRated(token, candidate.contextType, candidate.contextId)
    if (!rated) {
      selected = candidate
      break
    }
  }

  if (!selected) {
    const message = 'All terminal contexts are already rated by this user'
    if (STRICT_RATINGS) fail(message)
    console.log(`Skipping create-rating path: ${message}`)
    console.log('Ratings smoke checks passed (read-only path)')
    return
  }

  await submitRating(token, selected)
  await verifyRatingInList(selected)

  console.log('Ratings smoke checks passed')
}

main().catch((err) => {
  console.error(`Ratings smoke failed: ${err.message}`)
  process.exit(1)
})
