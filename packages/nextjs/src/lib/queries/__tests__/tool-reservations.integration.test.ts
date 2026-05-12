import { describe, it, expect } from 'vitest'
import { queryToolReservationsForUser } from '../tool-reservations'
import { seed } from '@/test-integration-setup'

describe('queryToolReservationsForUser', () => {
  it('returns reservation for borrower role', async () => {
    const rows = await queryToolReservationsForUser(seed.requesterUserId, 'borrower', 20, 0)
    expect(rows.some((r) => r.id === seed.toolReservationId)).toBe(true)
  })

  it('returns reservation for owner role', async () => {
    const rows = await queryToolReservationsForUser(seed.ownerUserId, 'owner', 20, 0)
    expect(rows.some((r) => r.id === seed.toolReservationId)).toBe(true)
  })

  it('returns empty array for unknown user', async () => {
    const rows = await queryToolReservationsForUser('00000000-0000-0000-0000-000000000000', 'borrower', 20, 0)
    expect(rows).toEqual([])
  })

  it('includes borrowerName in returned rows after DRY fix', async () => {
    const rows = await queryToolReservationsForUser(seed.requesterUserId, 'borrower', 20, 0)
    const reservation = rows.find((r) => r.id === seed.toolReservationId)
    expect(reservation).toBeDefined()
    expect(typeof reservation!.borrowerName === 'string' || reservation!.borrowerName === null).toBe(true)
  })
})
