type DateLike = Date | string | null | undefined

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const MEETING_TYPE_LABELS: Record<string, string> = {
  in_person: 'In person',
  online: 'Online',
  hybrid: 'Hybrid',
}

const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function formatDateTime(value: DateLike) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return dateTimeFormatter.format(date)
}

export function formatDate(value: DateLike) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return dateFormatter.format(date)
}

export function formatDateTimeLocalInput(value: DateLike) {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function toIsoStringFromLocalInput(value: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString()
}

export function humanizeValue(value: string | null | undefined) {
  if (!value) return '—'
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function formatMeetingType(value: string | null | undefined) {
  if (!value) return '—'
  return MEETING_TYPE_LABELS[value] ?? humanizeValue(value)
}

export function formatRequestStatus(value: string | null | undefined) {
  if (!value) return '—'
  return REQUEST_STATUS_LABELS[value] ?? humanizeValue(value)
}

// ─── Event status ──────────────────────────────────────────────────────────────

const EVENT_STATUS_LABELS: Record<string, string> = {
  published: 'Upcoming',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const EVENT_STATUS_CLASSES: Record<string, string> = {
  published: 'bg-blue-50 text-blue-700',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-50 text-red-600',
}

export function formatEventStatus(value: string | null | undefined) {
  if (!value) return '—'
  return EVENT_STATUS_LABELS[value] ?? humanizeValue(value)
}

export function eventStatusClass(value: string) {
  return EVENT_STATUS_CLASSES[value] ?? 'bg-gray-100 text-gray-500'
}

// ─── RSVP status ───────────────────────────────────────────────────────────────

const RSVP_STATUS_CLASSES: Record<string, string> = {
  attending: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export function rsvpStatusClass(value: string) {
  return RSVP_STATUS_CLASSES[value] ?? 'bg-gray-100 text-gray-500'
}

// ─── Drive / pledge status ─────────────────────────────────────────────────────

const DRIVE_STATUS_CLASSES: Record<string, string> = {
  open:      'bg-green-50 text-green-700',
  completed: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-red-50 text-red-600',
}

const PLEDGE_STATUS_CLASSES: Record<string, string> = {
  pledged:   'bg-green-100 text-green-700',
  fulfilled: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

export function driveStatusClass(value: string) {
  return DRIVE_STATUS_CLASSES[value] ?? 'bg-gray-100 text-gray-500'
}

export function pledgeStatusClass(value: string) {
  return PLEDGE_STATUS_CLASSES[value] ?? 'bg-gray-100 text-gray-500'
}