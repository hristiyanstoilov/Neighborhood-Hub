// ─── Date formatting ─────────────────────────────────────────────────────────

/** "12 Jan 14:30" — for request scheduled times and notification timestamps */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "Today 14:30" / "Yesterday" / "Mon" / "12 Jan" — for chat conversation list */
export function formatRelativeDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString('en-GB', { weekday: 'short' })
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ─── Meeting type ─────────────────────────────────────────────────────────────

const MEETING_TYPE_LABELS: Record<string, string> = {
  in_person: 'In person',
  online: 'Online',
  hybrid: 'Hybrid',
}

/** "in_person" → "In person", "online" → "Online", "hybrid" → "Hybrid" */
export function formatMeetingType(value: string): string {
  return MEETING_TYPE_LABELS[value] ?? value.replace(/_/g, ' ')
}

// ─── Status colors ────────────────────────────────────────────────────────────

/** Badge colors for skill listing status */
export const SKILL_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  available: { bg: '#d1fae5', text: '#065f46' },
  busy:      { bg: '#fef3c7', text: '#92400e' },
  retired:   { bg: '#f3f4f6', text: '#6b7280' },
}

/** Badge colors for skill request status */
export const REQUEST_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:   { bg: '#fef3c7', text: '#92400e' },
  accepted:  { bg: '#d1fae5', text: '#065f46' },
  rejected:  { bg: '#fee2e2', text: '#991b1b' },
  completed: { bg: '#dbeafe', text: '#1e40af' },
  cancelled: { bg: '#f3f4f6', text: '#6b7280' },
}
