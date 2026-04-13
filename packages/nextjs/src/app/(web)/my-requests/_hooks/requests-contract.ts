import type { RequestsRole } from './use-skill-requests'

export function skillRequestsQueryKey(viewerId: string, role: RequestsRole) {
  return ['skill-requests', viewerId, role] as const
}

export function requestActionErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    FORBIDDEN: 'You are not allowed to perform this action.',
    INVALID_TRANSITION: 'This action is no longer available.',
    REQUEST_ALREADY_TERMINAL: 'This request is already closed.',
    TOO_MANY_REQUESTS: 'Too many attempts. Please wait.',
  }

  return messages[error] ?? 'Something went wrong.'
}
