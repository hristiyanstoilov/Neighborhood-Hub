import { test, expect } from '@playwright/test'
import { registerAndVerifyUser } from './test-helpers'

const ts = Date.now()
const ownerEmail     = `food-owner-${ts}@e2e.test`
const requesterEmail = `food-req-${ts}@e2e.test`
const password       = 'TestPass123!'

test.describe('food sharing cycle', () => {
  let foodId: string
  let foodReservationId: string
  let ownerToken: string
  let requesterToken: string

  test('register both users', async ({ request }) => {
    await registerAndVerifyUser(request, ownerEmail, password)
    await registerAndVerifyUser(request, requesterEmail, password)
  })

  test('owner creates food share', async ({ request }) => {
    const login = await request.post('/api/auth/login', { data: { email: ownerEmail, password } })
    ownerToken = (await login.json()).data?.accessToken
    expect(ownerToken).toBeTruthy()

    const pickupAt = new Date(Date.now() + 2 * 86400 * 1000).toISOString()
    const res = await request.post('/api/food-shares', {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { title: `E2E Tomatoes ${ts}`, quantity: 5, pickupAt, status: 'available' },
    })
    expect(res.status()).toBe(201)
    foodId = (await res.json()).data?.id
    expect(foodId).toBeTruthy()
  })

  test('requester reserves food', async ({ request }) => {
    const login = await request.post('/api/auth/login', { data: { email: requesterEmail, password } })
    requesterToken = (await login.json()).data?.accessToken
    expect(requesterToken).toBeTruthy()

    const pickupAt = new Date(Date.now() + 2 * 86400 * 1000).toISOString()
    const res = await request.post(`/api/food-shares/${foodId}/reservations`, {
      headers: { Authorization: `Bearer ${requesterToken}` },
      data: { pickupAt },
    })
    expect(res.status()).toBe(201)
    foodReservationId = (await res.json()).data?.id
    expect(foodReservationId).toBeTruthy()
  })

  test('owner approves food reservation', async ({ request }) => {
    const res = await request.patch(`/api/food-shares/${foodId}/reservations/${foodReservationId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { action: 'approve' },
    })
    expect(res.status()).toBe(200)
  })

  test('owner marks food as picked up', async ({ request }) => {
    const res = await request.patch(`/api/food-shares/${foodId}/reservations/${foodReservationId}`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
      data: { action: 'picked_up' },
    })
    expect(res.status()).toBe(200)
    expect((await res.json()).data?.status).toBe('picked_up')
  })
})
