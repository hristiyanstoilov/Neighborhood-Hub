/**
 * Mobile layer QA — validates all fetch functions used by mobile screens
 * against the live API, matching exactly what the mobile query layer does.
 *
 * SMOKE_AUTH_EMAIL / SMOKE_AUTH_PASSWORD     → organizer
 * SMOKE_AUTH_OWNER_EMAIL / SMOKE_AUTH_OWNER_PASSWORD → pledger / attendee
 */

const BASE   = process.env.SMOKE_BASE_URL        || 'http://127.0.0.1:3000'
const ORG_EMAIL = process.env.SMOKE_AUTH_EMAIL       || ''
const ORG_PASS  = process.env.SMOKE_AUTH_PASSWORD    || ''
const ATT_EMAIL = process.env.SMOKE_AUTH_OWNER_EMAIL || ''
const ATT_PASS  = process.env.SMOKE_AUTH_OWNER_PASSWORD || ''

let passed = 0
let failed = 0

function url(path) { return `${BASE}${path}` }
function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}
function ok(label)          { console.log(`  ✓ ${label}`); passed++ }
function fail(label, detail) { console.error(`  ✗ ${label}`); if (detail) console.error(`    → ${detail}`); failed++ }
function assert(cond, label, detail) { cond ? ok(label) : fail(label, detail) }

async function login(email, password, label) {
  const res  = await fetch(url('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.1.1.1' },
    body: JSON.stringify({ email, password }),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok || !body?.data?.accessToken) throw new Error(`${label} login failed: ${res.status}`)
  return { token: body.data.accessToken, userId: body.data.user.id }
}

// ─── Mirrors mobile lib/queries/events.ts ────────────────────────────────────

async function testEventsQueryLayer(orgToken, orgId, attToken, attId) {
  console.log('\n── events.ts query layer ────────────────────────')
  const unique = Date.now()

  // fetchEventsList — status=published
  {
    const res  = await fetch(url('/api/events?status=published&limit=20&page=1'))
    const body = await res.json().catch(() => null)
    assert(res.ok && Array.isArray(body?.data), 'fetchEventsList({status:"published"}) → array')
    assert(typeof body?.total === 'number', 'fetchEventsList returns total:number')
    assert(typeof body?.page  === 'number', 'fetchEventsList returns page:number')
  }

  // fetchEventsList — status=completed
  {
    const res  = await fetch(url('/api/events?status=completed&limit=20&page=1'))
    const body = await res.json().catch(() => null)
    assert(res.ok && Array.isArray(body?.data), 'fetchEventsList({status:"completed"}) → array')
  }

  // fetchEventsList — status=cancelled
  {
    const res  = await fetch(url('/api/events?status=cancelled&limit=20&page=1'))
    const body = await res.json().catch(() => null)
    assert(res.ok && Array.isArray(body?.data), 'fetchEventsList({status:"cancelled"}) → array')
  }

  // Create event (organizer) — simulates events/new.tsx mutationFn
  let eventId
  {
    const startsAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    const endsAt   = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString()
    const res  = await fetch(url('/api/events'), {
      method: 'POST',
      headers: authHeaders(orgToken),
      body: JSON.stringify({ title: `Mobile QA Event ${unique}`, startsAt, endsAt, maxCapacity: 10 }),
    })
    const body = await res.json().catch(() => null)
    assert(res.status === 201 && body?.data?.id, 'POST /api/events (events/new.tsx mutation) → 201')
    eventId = body?.data?.id
  }
  if (!eventId) { fail('Skipping event detail tests — no eventId'); return null }

  // fetchEventDetail — simulates events/[id].tsx useQuery
  {
    const res  = await fetch(url(`/api/events/${eventId}`))
    const body = await res.json().catch(() => null)
    assert(res.ok, 'fetchEventDetail → 200')
    assert(typeof body?.data?.attendeeCount === 'number', 'EventDetail has attendeeCount:number')
    assert(body?.data?.organizerId === orgId, 'EventDetail has correct organizerId')
    assert(body?.data?.startsAt !== undefined, 'EventDetail has startsAt')
  }

  // RSVP — simulates events/[id].tsx rsvpMutation(attend)
  {
    const res  = await fetch(url(`/api/events/${eventId}/rsvp`), {
      method: 'POST', headers: authHeaders(attToken),
    })
    assert(res.status === 201, 'rsvpMutation("attend") → 201')
  }

  // attendeeCount increments (after RSVP the detail reflects it)
  {
    const res  = await fetch(url(`/api/events/${eventId}`))
    const body = await res.json().catch(() => null)
    assert(body?.data?.attendeeCount === 1, 'attendeeCount=1 after RSVP (detail refetch after mutation)')
  }

  // RSVP cancel — simulates rsvpMutation(cancel)
  {
    const res  = await fetch(url(`/api/events/${eventId}/rsvp`), {
      method: 'DELETE', headers: authHeaders(attToken),
    })
    assert(res.ok, 'rsvpMutation("cancel") → 200')
  }

  // Organizer cannot RSVP own event — screens should show organizer note, not button
  {
    const res = await fetch(url(`/api/events/${eventId}/rsvp`), {
      method: 'POST', headers: authHeaders(orgToken),
    })
    assert(res.status === 422, 'API returns 422 for organizer RSVP (guard shown as text, not button)')
  }

  // Cleanup
  await fetch(url(`/api/events/${eventId}`), { method: 'DELETE', headers: authHeaders(orgToken) })
  return eventId
}

// ─── Mirrors mobile lib/queries/drives.ts ────────────────────────────────────

async function testDrivesQueryLayer(orgToken, orgId, attToken, attId) {
  console.log('\n── drives.ts query layer ────────────────────────')
  const unique = Date.now()

  // fetchDrivesList — each status
  for (const status of ['open', 'completed', 'cancelled']) {
    const res  = await fetch(url(`/api/drives?status=${status}&limit=20&page=1`))
    const body = await res.json().catch(() => null)
    assert(res.ok && Array.isArray(body?.data), `fetchDrivesList({status:"${status}"}) → array`)
  }

  // fetchDrivesList — with driveType filter
  for (const t of ['items', 'food', 'money', 'other']) {
    const res  = await fetch(url(`/api/drives?status=open&driveType=${t}&limit=20&page=1`))
    const body = await res.json().catch(() => null)
    assert(res.ok && Array.isArray(body?.data), `fetchDrivesList({driveType:"${t}"}) → array`)
  }

  // Create drive — simulates drives/new.tsx mutationFn
  let driveId
  {
    const deadline = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    const res  = await fetch(url('/api/drives'), {
      method: 'POST',
      headers: authHeaders(orgToken),
      body: JSON.stringify({
        title:           `Mobile QA Drive ${unique}`,
        driveType:       'items',
        goalDescription: 'Collect 50 items',
        dropOffAddress:  '1 Test St',
        deadline,
      }),
    })
    const body = await res.json().catch(() => null)
    assert(res.status === 201 && body?.data?.id, 'POST /api/drives (drives/new.tsx mutation) → 201')
    driveId = body?.data?.id
  }
  if (!driveId) { fail('Skipping drive detail tests — no driveId'); return }

  // fetchDriveDetail — simulates drives/[id].tsx driveQuery
  {
    const res  = await fetch(url(`/api/drives/${driveId}`))
    const body = await res.json().catch(() => null)
    assert(res.ok, 'fetchDriveDetail → 200')
    assert(typeof body?.data?.pledgeCount === 'number', 'DriveDetail has pledgeCount:number')
    assert(body?.data?.organizerId === orgId, 'DriveDetail has correct organizerId')
    assert(body?.data?.dropOffAddress !== undefined, 'DriveDetail has dropOffAddress')
  }

  // fetchDrivePledges — simulates drives/[id].tsx pledgesQuery (empty initially)
  {
    const res  = await fetch(url(`/api/drives/${driveId}/pledges`))
    const body = await res.json().catch(() => null)
    assert(res.ok && Array.isArray(body?.data), 'fetchDrivePledges → array')
    assert(body.data.length === 0, 'fetchDrivePledges returns empty initially')
  }

  // pledgeMutation("create") — simulates drives/[id].tsx
  let pledgeId
  {
    const res  = await fetch(url(`/api/drives/${driveId}/pledges`), {
      method: 'POST',
      headers: authHeaders(attToken),
      body: JSON.stringify({ pledgeDescription: '5 winter coats' }),
    })
    const body = await res.json().catch(() => null)
    assert(res.status === 201 && body?.data?.id, 'pledgeMutation("create") → 201')
    pledgeId = body?.data?.id
  }

  // fetchDrivePledges after pledge — should have 1 entry
  {
    const res  = await fetch(url(`/api/drives/${driveId}/pledges`))
    const body = await res.json().catch(() => null)
    assert(body?.data?.length === 1, 'fetchDrivePledges returns 1 after pledge (drives/[id] re-fetch)')
  }

  // pledgeCount increments in detail
  {
    const res  = await fetch(url(`/api/drives/${driveId}`))
    const body = await res.json().catch(() => null)
    assert(body?.data?.pledgeCount === 1, 'pledgeCount=1 after pledge (detail re-fetch)')
  }

  // DrivePledge shape matches interface — check all fields
  {
    const res  = await fetch(url(`/api/drives/${driveId}/pledges`))
    const body = await res.json().catch(() => null)
    const p    = body?.data?.[0]
    assert(p?.id && p?.userId && p?.pledgeDescription && p?.status && p?.createdAt !== undefined,
      'DrivePledge has id, userId, pledgeDescription, status, createdAt')
  }

  // pledgeMutation("cancel") — simulates drives/[id].tsx handleCancelPledge
  if (pledgeId) {
    const res = await fetch(url(`/api/drives/${driveId}/pledges/${pledgeId}`), {
      method: 'PATCH',
      headers: authHeaders(attToken),
      body: JSON.stringify({ status: 'cancelled' }),
    })
    assert(res.ok, 'pledgeMutation("cancel") → 200')
  }

  // Organizer cannot pledge own drive — drives/[id] shows organizer note
  {
    const res = await fetch(url(`/api/drives/${driveId}/pledges`), {
      method: 'POST',
      headers: authHeaders(orgToken),
      body: JSON.stringify({ pledgeDescription: 'test' }),
    })
    assert(res.status === 422, 'API returns 422 for organizer pledge (guard shown as text, not form)')
  }

  // Cleanup
  await fetch(url(`/api/drives/${driveId}`), { method: 'DELETE', headers: authHeaders(orgToken) })
}

// ─── Validate EventDetail interface shape ─────────────────────────────────────

async function testEventDetailShape(orgToken) {
  console.log('\n── EventDetail interface shape ───────────────────')
  const startsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  const createRes = await fetch(url('/api/events'), {
    method: 'POST', headers: authHeaders(orgToken),
    body: JSON.stringify({ title: `Shape Test ${Date.now()}`, startsAt, address: '5 Shape St' }),
  })
  const createBody = await createRes.json().catch(() => null)
  const eventId    = createBody?.data?.id
  if (!eventId) { fail('Could not create event for shape test'); return }

  const res  = await fetch(url(`/api/events/${eventId}`))
  const body = await res.json().catch(() => null)
  const d    = body?.data

  assert(typeof d?.id          === 'string',  'EventDetail.id: string')
  assert(typeof d?.title       === 'string',  'EventDetail.title: string')
  assert(typeof d?.status      === 'string',  'EventDetail.status: string')
  assert(typeof d?.startsAt    === 'string',  'EventDetail.startsAt: string')
  assert(typeof d?.organizerId === 'string',  'EventDetail.organizerId: string')
  assert(typeof d?.attendeeCount === 'number','EventDetail.attendeeCount: number')
  assert(d?.endsAt     === null || typeof d?.endsAt === 'string',     'EventDetail.endsAt: string|null')
  assert(d?.address    === null || typeof d?.address === 'string',    'EventDetail.address: string|null')
  assert(d?.maxCapacity=== null || typeof d?.maxCapacity === 'number','EventDetail.maxCapacity: number|null')
  assert(d?.description=== null || typeof d?.description === 'string','EventDetail.description: string|null')

  await fetch(url(`/api/events/${eventId}`), { method: 'DELETE', headers: authHeaders(orgToken) })
}

// ─── Validate DriveDetail interface shape ─────────────────────────────────────

async function testDriveDetailShape(orgToken) {
  console.log('\n── DriveDetail interface shape ───────────────────')
  const createRes = await fetch(url('/api/drives'), {
    method: 'POST', headers: authHeaders(orgToken),
    body: JSON.stringify({ title: `Shape Drive ${Date.now()}`, driveType: 'food' }),
  })
  const createBody = await createRes.json().catch(() => null)
  const driveId    = createBody?.data?.id
  if (!driveId) { fail('Could not create drive for shape test'); return }

  const res  = await fetch(url(`/api/drives/${driveId}`))
  const body = await res.json().catch(() => null)
  const d    = body?.data

  assert(typeof d?.id          === 'string', 'DriveDetail.id: string')
  assert(typeof d?.title       === 'string', 'DriveDetail.title: string')
  assert(typeof d?.driveType   === 'string', 'DriveDetail.driveType: string')
  assert(typeof d?.status      === 'string', 'DriveDetail.status: string')
  assert(typeof d?.organizerId === 'string', 'DriveDetail.organizerId: string')
  assert(typeof d?.pledgeCount === 'number', 'DriveDetail.pledgeCount: number')
  assert(d?.deadline        === null || typeof d?.deadline        === 'string', 'DriveDetail.deadline: string|null')
  assert(d?.goalDescription === null || typeof d?.goalDescription === 'string', 'DriveDetail.goalDescription: string|null')
  assert(d?.dropOffAddress  === null || typeof d?.dropOffAddress  === 'string', 'DriveDetail.dropOffAddress: string|null')
  assert(d?.description     === null || typeof d?.description     === 'string', 'DriveDetail.description: string|null')

  await fetch(url(`/api/drives/${driveId}`), { method: 'DELETE', headers: authHeaders(orgToken) })
}

// ─── Auth guards (unauthenticated) ───────────────────────────────────────────

async function testAuthGuards() {
  console.log('\n── Auth guards (mobile mutation layer) ──────────')

  // events/new — POST without token → 401
  {
    const res = await fetch(url('/api/events'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'No auth', startsAt: new Date().toISOString() }),
    })
    assert(res.status === 401, 'POST /api/events without token → 401 (auth guard in new.tsx)')
  }

  // drives/new — POST without token → 401
  {
    const res = await fetch(url('/api/drives'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'No auth', driveType: 'items' }),
    })
    assert(res.status === 401, 'POST /api/drives without token → 401 (auth guard in new.tsx)')
  }

  // RSVP without token → 401
  {
    const res = await fetch(url('/api/events/some-id/rsvp'), { method: 'POST' })
    assert(res.status === 401, 'POST /rsvp without token → 401')
  }

  // Pledge without token → 401
  {
    const res = await fetch(url('/api/drives/some-id/pledges'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pledgeDescription: 'test' }),
    })
    assert(res.status === 401, 'POST /pledges without token → 401')
  }
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Mobile Events + Drives QA')
  console.log(`Base URL: ${BASE}`)

  if (!ORG_EMAIL || !ORG_PASS || !ATT_EMAIL || !ATT_PASS) {
    console.error('Missing required env vars.')
    process.exit(1)
  }

  let orgToken, orgId, attToken, attId
  try {
    ;({ token: orgToken, userId: orgId } = await login(ORG_EMAIL, ORG_PASS, 'Organizer'))
    ;({ token: attToken, userId: attId } = await login(ATT_EMAIL, ATT_PASS, 'Attendee'))
    console.log(`  ✓ Organizer (${orgId.slice(0,8)}…)`)
    console.log(`  ✓ Attendee  (${attId.slice(0,8)}…)`)
  } catch (err) {
    console.error(`Login failed: ${err.message}`)
    process.exit(1)
  }

  try {
    await testEventsQueryLayer(orgToken, orgId, attToken, attId)
    await testDrivesQueryLayer(orgToken, orgId, attToken, attId)
    await testEventDetailShape(orgToken)
    await testDriveDetailShape(orgToken)
    await testAuthGuards()
  } catch (err) {
    console.error(`\nUnexpected error: ${err.message}`)
    failed++
  }

  console.log('\n── Results ──────────────────────────────────────')
  console.log(`  Passed: ${passed}`)
  console.log(`  Failed: ${failed}`)
  if (failed > 0) process.exit(1)
}

main()
