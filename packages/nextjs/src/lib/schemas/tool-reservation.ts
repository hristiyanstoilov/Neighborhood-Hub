import { z } from 'zod'

// Accept either a full ISO datetime or a plain date (YYYY-MM-DD) from date inputs.
// Also validates that the value parses to a real calendar date.
const dateOrDatetime = z.string().refine(
  (v) => {
    if (!/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(v)) return false
    const d = new Date(v)
    return !isNaN(d.getTime())
  },
  { message: 'Expected a valid date (YYYY-MM-DD) or datetime string' },
)

export const createToolReservationSchema = z.object({
  toolId:    z.string().uuid(),
  startDate: dateOrDatetime,
  endDate:   dateOrDatetime,
  notes:     z.string().max(1000).optional(),
})

export const patchToolReservationSchema = z.object({
  action:             z.enum(['approve', 'reject', 'return', 'cancel']),
  cancellationReason: z.string().max(500).optional(),
})
