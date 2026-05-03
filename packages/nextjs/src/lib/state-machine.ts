import { NextResponse } from 'next/server'

/**
 * Describes one valid state transition in a state machine.
 */
export type TransitionRule = {
  /** The action string (e.g. 'accept', 'approve', 'cancel') */
  action: string
  /** Statuses from which this action is allowed */
  fromStatuses: string[]
  /** Which role(s) are allowed to trigger this action */
  allowedRoles: Array<'owner' | 'borrower' | 'requester'>
}

type RoleMap = {
  isOwner: boolean
  isBorrower?: boolean
  isRequester?: boolean
}

type TransitionError = { ok: false; response: ReturnType<typeof NextResponse.json> }
type TransitionOk    = { ok: true }

/**
 * Validates that the caller may perform `action` on an entity with
 * `currentStatus`, given the role map and transition rules.
 *
 * Returns `{ ok: true }` on success, or `{ ok: false, response }` with a
 * ready-to-return NextResponse on failure.
 */
export function validateTransition(
  action: string,
  currentStatus: string,
  terminalStatuses: string[],
  roles: RoleMap,
  rules: TransitionRule[],
): TransitionOk | TransitionError {
  if (terminalStatuses.includes(currentStatus)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'ALREADY_TERMINAL' }, { status: 422 }),
    }
  }

  const rule = rules.find((r) => r.action === action)
  if (!rule) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'INVALID_ACTION' }, { status: 400 }),
    }
  }

  if (!rule.fromStatuses.includes(currentStatus)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'INVALID_TRANSITION' }, { status: 422 }),
    }
  }

  const callerRoles: Array<'owner' | 'borrower' | 'requester'> = []
  if (roles.isOwner)     callerRoles.push('owner')
  if (roles.isBorrower)  callerRoles.push('borrower')
  if (roles.isRequester) callerRoles.push('requester')

  const hasRole = rule.allowedRoles.some((r) => callerRoles.includes(r))
  if (!hasRole) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }),
    }
  }

  return { ok: true }
}
