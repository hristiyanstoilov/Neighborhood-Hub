import { apiFetch } from '../api'

export type RequestRole = 'requester' | 'owner'
export type RequestAction = 'accept' | 'reject' | 'complete' | 'cancel'

export interface SkillRequestRow {
  id: string
  skillId: string
  skillTitle: string
  userFromId: string
  userToId: string
  requesterName: string | null
  ownerName: string | null
  scheduledStart: string
  scheduledEnd: string
  meetingType: string
  meetingUrl: string | null
  status: string
  notes: string | null
  cancellationReason: string | null
}

export const skillRequestsKeys = {
  all: ['skill-requests'] as const,
  list: (role: RequestRole) => [...skillRequestsKeys.all, 'list', role] as const,
}

function readErrorCode(json: unknown): string {
  if (json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string') {
    return (json as { error: string }).error
  }

  return 'UNKNOWN_ERROR'
}

export function getSkillRequestActionErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    NETWORK_ERROR: 'Network error. Please try again.',
    FORBIDDEN: 'You cannot perform this action.',
    INVALID_TRANSITION: 'This action is no longer available.',
    REQUEST_ALREADY_TERMINAL: 'This request is already closed.',
    TOO_MANY_REQUESTS: 'Too many attempts. Please wait.',
  }

  return messages[errorCode] ?? 'Something went wrong.'
}

export async function fetchSkillRequests(role: RequestRole): Promise<SkillRequestRow[]> {
  const res = await apiFetch(`/api/skill-requests?role=${role}&limit=50`)
  const json = await res.json()

  if (!res.ok) {
    throw new Error(readErrorCode(json))
  }

  return Array.isArray(json.data) ? json.data : []
}

export async function updateSkillRequestAction(input: {
  requestId: string
  action: RequestAction
  cancellationReason?: string
}): Promise<{ status: string }> {
  const res = await apiFetch(`/api/skill-requests/${input.requestId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      action: input.action,
      ...(input.cancellationReason ? { cancellationReason: input.cancellationReason } : {}),
    }),
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(readErrorCode(json))
  }

  return json.data ?? { status: 'unknown' }
}