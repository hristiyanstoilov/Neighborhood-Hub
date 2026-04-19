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

/** Badge colors for tool status */
export const TOOL_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  available: { bg: '#d1fae5', text: '#065f46' },
  in_use:    { bg: '#fef3c7', text: '#92400e' },
  on_loan:   { bg: '#dbeafe', text: '#1e40af' },
}

/** Human-readable tool status labels */
export const TOOL_STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  in_use:    'In use',
  on_loan:   'On loan',
}

/** Badge colors for tool reservation status */
export const RESERVATION_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending:   { bg: '#fef3c7', text: '#92400e' },
  approved:  { bg: '#d1fae5', text: '#065f46' },
  rejected:  { bg: '#fee2e2', text: '#991b1b' },
  returned:  { bg: '#dbeafe', text: '#1e40af' },
  cancelled: { bg: '#f3f4f6', text: '#6b7280' },
}

/** "2024-01-15T..." → "15 Jan 2024" without timezone shift */
export function formatDateOnly(dateStr: string): string {
  const part = dateStr.slice(0, 10)
  const [year, month, day] = part.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

/** Human-readable label for any status string */
export function humanizeValue(value: string | null | undefined): string {
  if (!value) return '—'
  return value.replaceAll('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

// ─── Event status ─────────────────────────────────────────────────────────────

export const EVENT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  published: { bg: '#dbeafe', text: '#1e40af' },
  completed: { bg: '#f3f4f6', text: '#6b7280' },
  cancelled: { bg: '#fee2e2', text: '#991b1b' },
}

export const EVENT_STATUS_LABELS: Record<string, string> = {
  published: 'Upcoming',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const RSVP_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  attending: { bg: '#d1fae5', text: '#065f46' },
  cancelled: { bg: '#f3f4f6', text: '#6b7280' },
}

// ─── Drive / pledge status ────────────────────────────────────────────────────

export const DRIVE_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open:      { bg: '#d1fae5', text: '#065f46' },
  completed: { bg: '#dbeafe', text: '#1e40af' },
  cancelled: { bg: '#fee2e2', text: '#991b1b' },
}

export const PLEDGE_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pledged:   { bg: '#d1fae5', text: '#065f46' },
  fulfilled: { bg: '#dbeafe', text: '#1e40af' },
  cancelled: { bg: '#f3f4f6', text: '#6b7280' },
}
