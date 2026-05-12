import { describe, expect, it } from 'vitest'
import {
  driveStatusClass,
  eventStatusClass,
  formatDate,
  formatDateTime,
  formatDateTimeLocalInput,
  formatEventStatus,
  formatMeetingType,
  formatRequestStatus,
  humanizeValue,
  pledgeStatusClass,
  rsvpStatusClass,
  toIsoStringFromLocalInput,
} from './format'

const dateTimeOptions: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
}

const dateOptions: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', dateTimeOptions)
const dateFormatter = new Intl.DateTimeFormat('en-GB', dateOptions)

describe('formatDateTime', () => {
  it('formats a valid date', () => {
    const value = new Date('2026-05-11T14:05:00.000Z')
    expect(formatDateTime(value)).toBe(dateTimeFormatter.format(value))
  })

  it('returns a safe fallback for null or undefined', () => {
    expect(formatDateTime(null)).toBe('—')
    expect(formatDateTime(undefined)).toBe('—')
  })

  it('returns a safe fallback for an invalid date', () => {
    expect(formatDateTime('not-a-date')).toBe('—')
  })
})

describe('formatDate', () => {
  it('formats a valid date', () => {
    const value = new Date('2026-05-11T14:05:00.000Z')
    expect(formatDate(value)).toBe(dateFormatter.format(value))
  })

  it('returns a safe fallback for null or undefined', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate(undefined)).toBe('—')
  })

  it('returns a safe fallback for an invalid date', () => {
    expect(formatDate('not-a-date')).toBe('—')
  })
})

describe('formatDateTimeLocalInput', () => {
  it('formats a valid date for local datetime input', () => {
    const value = new Date('2026-05-11T14:05:00.000Z')
    const expected = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}T${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`

    expect(formatDateTimeLocalInput(value)).toBe(expected)
  })

  it('returns an empty string for null or undefined', () => {
    expect(formatDateTimeLocalInput(null)).toBe('')
    expect(formatDateTimeLocalInput(undefined)).toBe('')
  })

  it('returns an empty string for an invalid date', () => {
    expect(formatDateTimeLocalInput('not-a-date')).toBe('')
  })
})

describe('toIsoStringFromLocalInput', () => {
  it('converts a valid local datetime string to ISO', () => {
    expect(toIsoStringFromLocalInput('2026-05-11T14:05')).toBe(new Date('2026-05-11T14:05').toISOString())
  })

  it('returns a safe fallback for empty input', () => {
    expect(toIsoStringFromLocalInput('')).toBe('')
  })

  it('returns a safe fallback for an invalid local datetime string', () => {
    expect(toIsoStringFromLocalInput('not-a-date')).toBe('')
  })
})

describe('humanizeValue', () => {
  it('humanizes snake_case values', () => {
    expect(humanizeValue('in_person')).toBe('In Person')
  })

  it('returns a safe fallback for null or undefined', () => {
    expect(humanizeValue(null)).toBe('—')
    expect(humanizeValue(undefined)).toBe('—')
  })

  it('handles unknown values without throwing', () => {
    expect(humanizeValue('unknown_status_value')).toBe('Unknown Status Value')
  })
})

describe('formatMeetingType', () => {
  it('formats a known meeting type', () => {
    expect(formatMeetingType('in_person')).toBe('In person')
  })

  it('returns a safe fallback for null or undefined', () => {
    expect(formatMeetingType(null)).toBe('—')
    expect(formatMeetingType(undefined)).toBe('—')
  })

  it('humanizes an unknown value without throwing', () => {
    expect(formatMeetingType('curbside_pickup')).toBe('Curbside Pickup')
  })
})

describe('formatRequestStatus', () => {
  it('formats a known request status', () => {
    expect(formatRequestStatus('accepted')).toBe('Accepted')
  })

  it('returns a safe fallback for null or undefined', () => {
    expect(formatRequestStatus(null)).toBe('—')
    expect(formatRequestStatus(undefined)).toBe('—')
  })

  it('humanizes an unknown value without throwing', () => {
    expect(formatRequestStatus('awaiting_review')).toBe('Awaiting Review')
  })
})

describe('formatEventStatus', () => {
  it('formats a known event status', () => {
    expect(formatEventStatus('published')).toBe('Upcoming')
  })

  it('returns a safe fallback for null or undefined', () => {
    expect(formatEventStatus(null)).toBe('—')
    expect(formatEventStatus(undefined)).toBe('—')
  })

  it('humanizes an unknown value without throwing', () => {
    expect(formatEventStatus('awaiting_approval')).toBe('Awaiting Approval')
  })
})

describe('eventStatusClass', () => {
  it('returns the class for a known event status', () => {
    expect(eventStatusClass('published')).toBe('bg-blue-50 text-blue-700')
  })

  it('returns a safe fallback for null or undefined', () => {
    expect(eventStatusClass(undefined as unknown as string)).toBe('bg-gray-100 text-gray-500')
  })

  it('returns a safe fallback for an unknown value', () => {
    expect(eventStatusClass('unknown')).toBe('bg-gray-100 text-gray-500')
  })
})

describe('rsvpStatusClass', () => {
  it('returns the class for a known RSVP status', () => {
    expect(rsvpStatusClass('attending')).toBe('bg-green-100 text-green-700')
  })

  it('returns a safe fallback for null or undefined', () => {
    expect(rsvpStatusClass(undefined as unknown as string)).toBe('bg-gray-100 text-gray-500')
  })

  it('returns a safe fallback for an unknown value', () => {
    expect(rsvpStatusClass('maybe')).toBe('bg-gray-100 text-gray-500')
  })
})

describe('driveStatusClass', () => {
  it('returns the class for a known drive status', () => {
    expect(driveStatusClass('open')).toBe('bg-green-50 text-green-700')
  })

  it('returns a safe fallback for null or undefined', () => {
    expect(driveStatusClass(undefined as unknown as string)).toBe('bg-gray-100 text-gray-500')
  })

  it('returns a safe fallback for an unknown value', () => {
    expect(driveStatusClass('paused')).toBe('bg-gray-100 text-gray-500')
  })
})

describe('pledgeStatusClass', () => {
  it('returns the class for a known pledge status', () => {
    expect(pledgeStatusClass('fulfilled')).toBe('bg-blue-50 text-blue-700')
  })

  it('returns a safe fallback for null or undefined', () => {
    expect(pledgeStatusClass(undefined as unknown as string)).toBe('bg-gray-100 text-gray-500')
  })

  it('returns a safe fallback for an unknown value', () => {
    expect(pledgeStatusClass('partial')).toBe('bg-gray-100 text-gray-500')
  })
})
