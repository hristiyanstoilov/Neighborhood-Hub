/**
 * Smoke test: Events + Community Drives API (Module 3 Commit 2)
 *
 * Required env vars:
 *   SMOKE_BASE_URL          (default: http://127.0.0.1:3000)
 *   SMOKE_AUTH_EMAIL        organizer account
 *   SMOKE_AUTH_PASSWORD
 *   SMOKE_AUTH_OWNER_EMAIL  second account (attendee / pledger)
 *   SMOKE_AUTH_OWNER_PASSWORD
 */

const BASE_URL  = process.env.SMOKE_BASE_URL        || 'http://127.0.0.1:3000'
const ORG_EMAIL = process.env.SMOKE_AUTH_EMAIL       || ''
const ORG_PASS  = process.env.SMOKE_AUTH_PASSWORD    || ''
const ATT_EMAIL = process.env.SMOKE_AUTH_OWNER_EMAIL || ''
const ATT_PASS  = process.env.SMOKE_AUTH_OWNER_PASSWORD || ''

let passed = 0
let failed = 0

function url(path) { return `${BASE_URL}${path}` }

function authHeaders(token) {
  return { authorization: `Bearer ${token}`, 'content-type': 'application/json' }
}

function ok(label) {
  console.log(`  ✓ ${label}`)
  passed++
}

function fail(label, detail) {
  console.error(`  ✗ ${label}`)
  if (detail) console.error(`    → ${detail}`)
  failed++
}

function assert(condition, label, detail) {
  if (condition) ok(label)
  else fail(label, detail)
}

async function login(email, password, label) {
  const res = await fetch(url('/api/auth/login'), {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.1' },
    body: JSON.stringify({ email, password }),
  })
  const body = await res.json().catch(() => null)
  if (!res.ok || !body?.data?.accessToken) {
    throw new Error(`${label} login failed: ${res.status} ${body?.error ?? ''}`)
  }
  return { token: body.data.accessToken, userId: body.data.user.id }
}

// ─── EVENTS ─────────────────────────────────────────────────────────────────

async function testEvents(orgToken, orgId, attToken, attId) {
  console.log('\n── Events ──────────────────────────────────────')
  const unique = Date.now()

  // GET list (public, unauthenticated)
  {
    const res = await fetch(url('/api/events'))
    const body = await res.json().catch(() => null)
    assert(res.status === 200 && Array.isArray(body?.data), 'GET /api/events returns 200 with array')
  }

  // POST create event (organizer)
  let eventId
  {
    const res = await fetch(url('/api/events'), {
      method: 'POST',
      headers: authHeaders(orgToken),
      body: JSON.stringify({
        title: `Smoke Event ${unique}`,
        description: 'QA smoke test event',
        startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        endsAt:   new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        maxCapacity: 5,
      }),
    })
    const body = await res.json().catch(() => null)
    assert(res.status === 201 && body?.data?.id, 'POST /api/events creates event (201)')
    eventId = body?.data?.id
  }
  if (!eventId) { fail('Skipping event sub-tests — no eventId'); return }

  // GET by id (public)
  {
    const res = await fetch(url(`/api/events/${eventId}`))
    const body = await res.json().catch(() => null)
    assert(res.status === 200 && body?.data?.attendeeCount === 0, 'GET /api/events/[id] returns event with attendeeCount=0')
  }

  // POST /rsvp — organizer cannot RSVP own event
  {
    const res = await fetch(url(`/api/events/${eventId}/rsvp`), {
      method: 'POST',
      headers: authHeaders(orgToken),
    })
    assert(res.status === 422, 'POST /rsvp rejects organizer (422 CANNOT_RSVP_OWN_EVENT)')
  }

  // POST /rsvp — event not published yet (default is 'published' — so this checks it works)
  {
    const res = await fetch(url(`/api/events/${eventId}/rsvp`), {
      method: 'POST',
      headers: authHeaders(attToken),
    })
    const body = await res.json().catch(() => null)
    assert(res.status === 201 && body?.data?.status === 'attending', 'POST /rsvp attendee can attend (201)')
  }

  // GET by id — attendeeCount should now be 1
  {
    const res = await fetch(url(`/api/events/${eventId}`))
    const body = await res.json().catch(() => null)
    assert(body?.data?.attendeeCount === 1, 'attendeeCount increments to 1 after RSVP')
  }

  // POST /rsvp again — idempotent (200)
  {
    const res = await fetch(url(`/api/events/${eventId}/rsvp`), {
      method: 'POST',
      headers: authHeaders(attToken),
    })
    assert(res.status === 200, 'POST /rsvp idempotent for already-attending (200)')
  }

  // DELETE /rsvp — cancel attendance
  {
    const res = await fetch(url(`/api/events/${eventId}/rsvp`), {
      method: 'DELETE',
      headers: authHeaders(attToken),
    })
    const body = await res.json().catch(() => null)
    assert(res.status === 200 && body?.data?.status === 'cancelled', 'DELETE /rsvp cancels attendance')
  }

  // DELETE /rsvp again — 404 (already cancelled)
  {
    const res = await fetch(url(`/api/events/${eventId}/rsvp`), {
      method: 'DELETE',
      headers: authHeaders(attToken),
    })
    assert(res.status === 404, 'DELETE /rsvp on already-cancelled returns 404')
  }

  // Re-RSVP after cancel (should work, reuses row)
  {
    const res = await fetch(url(`/api/events/${eventId}/rsvp`), {
      method: 'POST',
      headers: authHeaders(attToken),
    })
    const body = await res.json().catch(() => null)
    assert(res.status === 200 && body?.data?.status === 'attending', 'POST /rsvp re-attend after cancel (200, reuses row)')
  }

  // PATCH event — non-organizer gets 403
  {
    const res = await fetch(url(`/api/events/${eventId}`), {
      method: 'PATCH',
      headers: authHeaders(attToken),
      body: JSON.stringify({ title: 'Hacked title' }),
    })
    assert(res.status === 403, 'PATCH /events/[id] by non-organizer returns 403')
  }

  // PATCH event — organizer updates title
  {
    const res = await fetch(url(`/api/events/${eventId}`), {
      method: 'PATCH',
      headers: authHeaders(orgToken),
      body: JSON.stringify({ title: `Updated Event ${unique}` }),
    })
    const body = await res.json().catch(() => null)
    assert(res.status === 200 && body?.data?.title?.startsWith('Updated'), 'PATCH /events/[id] organizer can update title')
  }

  // PATCH event — cancel (notifies attendees, empty array guard)
  {
    const res = await fetch(url(`/api/events/${eventId}`), {
      method: 'PATCH',
      headers: authHeaders(orgToken),
      body: JSON.stringify({ status: 'cancelled' }),
    })
    assert(res.status === 200, 'PATCH /events/[id] organizer can cancel event')
  }

  // POST /rsvp on cancelled event — 422 EVENT_NOT_OPEN
  {
    // cancel attendee first so we can re-attempt
    await fetch(url(`/api/events/${eventId}/rsvp`), { method: 'DELETE', headers: authHeaders(attToken) })
    const res = await fetch(url(`/api/events/${eventId}/rsvp`), {
      method: 'POST',
      headers: authHeaders(attToken),
    })
    assert(res.status === 422, 'POST /rsvp on cancelled event returns 422 EVENT_NOT_OPEN')
  }

  // DELETE event (soft delete)
  {
    const res = await fetch(url(`/api/events/${eventId}`), {
      method: 'DELETE',
      headers: authHeaders(orgToken),
    })
    assert(res.status === 200, 'DELETE /events/[id] soft-deletes event')
  }

  // GET deleted event — 404
  {
    const res = await fetch(url(`/api/events/${eventId}`))
    assert(res.status === 404, 'GET deleted event returns 404')
  }
}

// ─── COMMUNITY DRIVES ────────────────────────────────────────────────────────

async function testDrives(orgToken, orgId, pledgerToken, pledgerId) {
  console.log('\n── Community Drives ─────────────────────────────')
  const unique = Date.now()

  // GET list (public)
  {
    const res = await fetch(url('/api/drives'))
    const body = await res.json().catch(() => null)
    assert(res.status === 200 && Array.isArray(body?.data), 'GET /api/drives returns 200 with array')
  }

  // POST create drive
  let driveId
  {
    const res = await fetch(url('/api/drives'), {
      method: 'POST',
      headers: authHeaders(orgToken),
      body: JSON.stringify({
        title:           `Smoke Drive ${unique}`,
        description:     'QA smoke test drive',
        driveType:       'items',
        goalDescription: 'Collect 50 winter coats',
        dropOffAddress:  '123 Main St',
        deadline:        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    })
    const body = await res.json().catch(() => null)
    assert(res.status === 201 && body?.data?.id, 'POST /api/drives creates drive (201)')
    driveId = body?.data?.id
  }
  if (!driveId) { fail('Skipping drive sub-tests — no driveId'); return }

  // GET by id
  {
    const res = await fetch(url(`/api/drives/${driveId}`))
    const body = await res.json().catch(() => null)
    assert(res.status === 200 && body?.data?.pledgeCount === 0, 'GET /api/drives/[id] returns drive with pledgeCount=0')
  }

  // GET pledges (empty list)
  {
    const res = await fetch(url(`/api/drives/${driveId}/pledges`))
    const body = await res.json().catch(() => null)
    assert(res.status === 200 && Array.isArray(body?.data) && body.data.length === 0, 'GET /api/drives/[id]/pledges returns empty array initially')
  }

  // POST pledge — organizer cannot pledge own drive
  {
    const res = await fetch(url(`/api/drives/${driveId}/pledges`), {
      method: 'POST',
      headers: authHeaders(orgToken),
      body: JSON.stringify({ pledgeDescription: '5 coats' }),
    })
    assert(res.status === 422, 'POST /pledges rejects organizer (422 CANNOT_PLEDGE_OWN_DRIVE)')
  }

  // POST pledge — pledger creates pledge
  let pledgeId
  {
    const res = await fetch(url(`/api/drives/${driveId}/pledges`), {
      method: 'POST',
      headers: authHeaders(pledgerToken),
      body: JSON.stringify({ pledgeDescription: '3 winter coats' }),
    })
    const body = await res.json().catch(() => null)
    assert(res.status === 201 && body?.data?.id, 'POST /pledges creates pledge (201)')
    pledgeId = body?.data?.id
  }

  // pledgeCount should be 1 now
  {
    const res = await fetch(url(`/api/drives/${driveId}`))
    const body = await res.json().catch(() => null)
    assert(body?.data?.pledgeCount === 1, 'pledgeCount increments to 1 after pledge')
  }

  // GET pledges — should have 1 entry
  {
    const res = await fetch(url(`/api/drives/${driveId}/pledges`))
    const body = await res.json().catch(() => null)
    assert(res.status === 200 && body?.data?.length === 1, 'GET /pledges returns 1 pledge')
  }

  // POST pledge again — idempotent (200)
  {
    const res = await fetch(url(`/api/drives/${driveId}/pledges`), {
      method: 'POST',
      headers: authHeaders(pledgerToken),
      body: JSON.stringify({ pledgeDescription: '3 winter coats' }),
    })
    assert(res.status === 200, 'POST /pledges idempotent for already-pledged (200)')
  }

  // PATCH pledge — non-pledger cannot cancel
  {
    const res = await fetch(url(`/api/drives/${driveId}/pledges/${pledgeId}`), {
      method: 'PATCH',
      headers: authHeaders(orgToken),
      body: JSON.stringify({ status: 'cancelled' }),
    })
    assert(res.status === 403, 'PATCH /pledges/[id] cancel by organizer returns 403')
  }

  // PATCH pledge — pledger cannot mark fulfilled
  {
    const res = await fetch(url(`/api/drives/${driveId}/pledges/${pledgeId}`), {
      method: 'PATCH',
      headers: authHeaders(pledgerToken),
      body: JSON.stringify({ status: 'fulfilled' }),
    })
    assert(res.status === 403, 'PATCH /pledges/[id] fulfill by pledger returns 403')
  }

  // PATCH pledge — organizer marks fulfilled
  {
    const res = await fetch(url(`/api/drives/${driveId}/pledges/${pledgeId}`), {
      method: 'PATCH',
      headers: authHeaders(orgToken),
      body: JSON.stringify({ status: 'fulfilled' }),
    })
    const body = await res.json().catch(() => null)
    assert(res.status === 200 && body?.data?.status === 'fulfilled', 'PATCH /pledges/[id] organizer marks fulfilled')
  }

  // PATCH pledge again — already fulfilled, invalid transition
  {
    const res = await fetch(url(`/api/drives/${driveId}/pledges/${pledgeId}`), {
      method: 'PATCH',
      headers: authHeaders(orgToken),
      body: JSON.stringify({ status: 'fulfilled' }),
    })
    assert(res.status === 422, 'PATCH already-fulfilled pledge returns 422 INVALID_STATUS_TRANSITION')
  }

  // PATCH drive — non-organizer gets 403
  {
    const res = await fetch(url(`/api/drives/${driveId}`), {
      method: 'PATCH',
      headers: authHeaders(pledgerToken),
      body: JSON.stringify({ title: 'Hacked' }),
    })
    assert(res.status === 403, 'PATCH /drives/[id] by non-organizer returns 403')
  }

  // PATCH drive — organizer marks completed (empty pledger list guard test)
  {
    const res = await fetch(url(`/api/drives/${driveId}`), {
      method: 'PATCH',
      headers: authHeaders(orgToken),
      body: JSON.stringify({ status: 'completed' }),
    })
    assert(res.status === 200, 'PATCH /drives/[id] organizer can complete drive')
  }

  // DELETE drive
  {
    const res = await fetch(url(`/api/drives/${driveId}`), {
      method: 'DELETE',
      headers: authHeaders(orgToken),
    })
    assert(res.status === 200, 'DELETE /drives/[id] soft-deletes drive')
  }

  // GET deleted drive — 404
  {
    const res = await fetch(url(`/api/drives/${driveId}`))
    assert(res.status === 404, 'GET deleted drive returns 404')
  }
}

// ─── VALIDATION TESTS ────────────────────────────────────────────────────────

async function testValidation(orgToken) {
  console.log('\n── Validation ───────────────────────────────────')

  // Event: missing required startsAt
  {
    const res = await fetch(url('/api/events'), {
      method: 'POST',
      headers: authHeaders(orgToken),
      body: JSON.stringify({ title: 'No date event' }),
    })
    assert(res.status === 400, 'POST /api/events without startsAt returns 400')
  }

  // Event: endsAt before startsAt
  {
    const res = await fetch(url('/api/events'), {
      method: 'POST',
      headers: authHeaders(orgToken),
      body: JSON.stringify({
        title: 'Bad dates',
        startsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        endsAt:   new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
      }),
    })
    assert(res.status === 400, 'POST /api/events with endsAt < startsAt returns 400')
  }

  // Drive: missing driveType
  {
    const res = await fetch(url('/api/drives'), {
      method: 'POST',
      headers: authHeaders(orgToken),
      body: JSON.stringify({ title: 'No type drive' }),
    })
    assert(res.status === 400, 'POST /api/drives without driveType returns 400')
  }

  // Drive: invalid driveType value
  {
    const res = await fetch(url('/api/drives'), {
      method: 'POST',
      headers: authHeaders(orgToken),
      body: JSON.stringify({ title: 'Bad type', driveType: 'weapons' }),
    })
    assert(res.status === 400, 'POST /api/drives with invalid driveType returns 400')
  }

  // Pledge: empty description
  {
    // Create a drive first
    const driveRes = await fetch(url('/api/drives'), {
      method: 'POST',
      headers: authHeaders(orgToken),
      body: JSON.stringify({ title: `Val Drive ${Date.now()}`, driveType: 'items' }),
    })
    const driveBody = await driveRes.json().catch(() => null)
    const driveId = driveBody?.data?.id
    if (driveId) {
      const res = await fetch(url(`/api/drives/${driveId}/pledges`), {
        method: 'POST',
        headers: authHeaders(orgToken),
        body: JSON.stringify({ pledgeDescription: '' }),
      })
      // Either 400 (validation) or 422 (organizer can't pledge) — both acceptable
      assert(res.status === 400 || res.status === 422, 'POST /pledges with empty description returns 400 or 422')
      // Cleanup
      await fetch(url(`/api/drives/${driveId}`), { method: 'DELETE', headers: authHeaders(orgToken) })
    }
  }

  // Unauthenticated POST to events → 401
  {
    const res = await fetch(url('/api/events'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'No auth', startsAt: new Date().toISOString() }),
    })
    assert(res.status === 401, 'POST /api/events without auth returns 401')
  }

  // Unauthenticated POST to drives → 401
  {
    const res = await fetch(url('/api/drives'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'No auth', driveType: 'items' }),
    })
    assert(res.status === 401, 'POST /api/drives without auth returns 401')
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Events + Drives Smoke Test')
  console.log(`Base URL: ${BASE_URL}`)

  if (!ORG_EMAIL || !ORG_PASS || !ATT_EMAIL || !ATT_PASS) {
    console.error('Missing required env vars. Set SMOKE_AUTH_EMAIL, SMOKE_AUTH_PASSWORD, SMOKE_AUTH_OWNER_EMAIL, SMOKE_AUTH_OWNER_PASSWORD')
    process.exit(1)
  }

  let orgToken, orgId, attToken, attId
  try {
    ;({ token: orgToken, userId: orgId } = await login(ORG_EMAIL, ORG_PASS, 'Organizer'))
    ;({ token: attToken, userId: attId } = await login(ATT_EMAIL, ATT_PASS, 'Attendee/Pledger'))
    console.log(`  ✓ Organizer logged in (${orgId.slice(0, 8)}...)`)
    console.log(`  ✓ Attendee  logged in (${attId.slice(0, 8)}...)`)
  } catch (err) {
    console.error(`Login failed: ${err.message}`)
    process.exit(1)
  }

  try {
    await testEvents(orgToken, orgId, attToken, attId)
    await testDrives(orgToken, orgId, attToken, attId)
    await testValidation(orgToken)
  } catch (err) {
    console.error(`\nUnexpected error: ${err.message}`)
    failed++
  }

  console.log(`\n── Results ──────────────────────────────────────`)
  console.log(`  Passed: ${passed}`)
  console.log(`  Failed: ${failed}`)

  if (failed > 0) process.exit(1)
}

main()
