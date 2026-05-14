import { test, expect } from '@playwright/test'
import { registerAndVerifyUser } from './test-helpers'

const ts = Date.now()
const ownerEmail     = `tool-owner-${ts}@e2e.test`
const borrowerEmail  = `tool-borrower-${ts}@e2e.test`
const password       = 'TestPass123!'

test.describe('tool reservation cycle', () => {
  let toolId: string
  let reservationId: string
  let ownerToken: string
  let borrowerToken: string

  test('register both users', async ({ request }) => {
    await registerAndVerifyUser(request, ownerEmail, password)
    await registerAndVerifyUser(request, borrowerEmail, password)
  })

  test('owner creates tool', async ({ request }) => {
    const login = await request.post('/api/auth/login', { data: { email: ownerEmail, password } })
    ownerToken = (await login.json()).data?.accessToken
    expect(ownerToken).toBeTruthy()

    const res = await request.post('/api/tools', {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { title: `E2E Drill ${ts}`, condition: 'good', status: 'available' },
    })
    expect(res.status()).toBe(201)
    toolId = (await res.json()).data?.id
    expect(toolId).toBeTruthy()
  })

  test('borrower reserves tool', async ({ request }) => {
    const login = await request.post('/api/auth/login', { data: { email: borrowerEmail, password } })
    borrowerToken = (await login.json()).data?.accessToken
    expect(borrowerToken).toBeTruthy()

    const startDate = new Date(Date.now() + 2 * 86400 * 1000).toISOString().split('T')[0]
    const endDate   = new Date(Date.now() + 5 * 86400 * 1000).toISOString().split('T')[0]

    const res = await request.post('/api/tool-reservations', {
      headers: { Authorization: `Bearer ${borrowerToken}` },
      data: { toolId, startDate, endDate },
    })
    expect(res.status()).toBe(201)
    reservationId = (await res.json()).data?.id
    expect(reservationId).toBeTruthy()
  })

  test('owner approves reservation', async ({ request }) => {
    const res = await request.patch(`/api/tool-reservations/${reservationId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { action: 'approve' },
    })
    expect(res.status()).toBe(200)
  })

  test('borrower marks as returned', async ({ request }) => {
    const res = await request.patch(`/api/tool-reservations/${reservationId}`, {
      headers: { Authorization: `Bearer ${borrowerToken}` },
      data: { action: 'return' },
    })
    expect(res.status()).toBe(200)
    expect((await res.json()).data?.status).toBe('returned')
  })
})
