import { describe, it, expect, vi } from 'vitest'

// Mock NextResponse before importing the module under test
vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}))

import { validateTransition, type TransitionRule } from './state-machine'

const RULES: TransitionRule[] = [
  { action: 'approve', fromStatuses: ['pending'], allowedRoles: ['owner'] },
  { action: 'cancel', fromStatuses: ['pending', 'accepted'], allowedRoles: ['requester'] },
  { action: 'complete', fromStatuses: ['accepted'], allowedRoles: ['owner'] },
]

const TERMINAL = ['completed', 'cancelled', 'rejected']

describe('validateTransition', () => {
  it('returns ok:true for a valid transition', () => {
    const result = validateTransition('approve', 'pending', TERMINAL, { isOwner: true }, RULES)
    expect(result.ok).toBe(true)
  })

  it('returns ALREADY_TERMINAL when current status is terminal', () => {
    const result = validateTransition('approve', 'completed', TERMINAL, { isOwner: true }, RULES)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.body).toEqual({ error: 'ALREADY_TERMINAL' })
  })

  it('returns INVALID_ACTION for an unknown action', () => {
    const result = validateTransition('unknown', 'pending', TERMINAL, { isOwner: true }, RULES)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.body).toEqual({ error: 'INVALID_ACTION' })
  })

  it('returns INVALID_TRANSITION when current status is not in fromStatuses', () => {
    // "approve" only valid from "pending", not "accepted"
    const result = validateTransition('approve', 'accepted', TERMINAL, { isOwner: true }, RULES)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.body).toEqual({ error: 'INVALID_TRANSITION' })
  })

  it('returns FORBIDDEN when caller lacks the required role', () => {
    // "approve" is owner-only; requester should be forbidden
    const result = validateTransition('approve', 'pending', TERMINAL, { isOwner: false, isRequester: true }, RULES)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.body).toEqual({ error: 'FORBIDDEN' })
  })

  it('allows multi-status fromStatuses — cancel from accepted', () => {
    const result = validateTransition('cancel', 'accepted', TERMINAL, { isOwner: false, isRequester: true }, RULES)
    expect(result.ok).toBe(true)
  })

  it('returns correct 422 status for ALREADY_TERMINAL', () => {
    const result = validateTransition('approve', 'cancelled', TERMINAL, { isOwner: true }, RULES)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(422)
  })

  it('returns correct 403 status for FORBIDDEN', () => {
    const result = validateTransition('approve', 'pending', TERMINAL, { isOwner: false }, RULES)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })
})
