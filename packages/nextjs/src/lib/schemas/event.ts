import { z } from 'zod'
import { PAGINATION_DEFAULTS } from '@/lib/query-defaults'

export const createEventSchema = z.object({
  title:       z.string().trim().min(3).max(200),
  description: z.string().trim().max(5000).optional(),
  locationId:  z.string().uuid().optional(),
  address:     z.string().trim().max(300).optional(),
  startsAt:    z.string().datetime().refine((v) => new Date(v) > new Date(), 'startsAt must be in the future'),
  endsAt:      z.string().datetime().optional(),
  maxCapacity: z.coerce.number().int().min(1).optional(),
  imageUrl:    z.string().url().max(2048).optional(),
})

export const updateEventSchema = z.object({
  title:       z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  locationId:  z.string().uuid().nullable().optional(),
  address:     z.string().trim().max(300).nullable().optional(),
  startsAt:    z.string().datetime().refine((v) => new Date(v) > new Date(), 'startsAt must be in the future').optional(),
  endsAt:      z.string().datetime().nullable().optional(),
  maxCapacity: z.coerce.number().int().min(1).nullable().optional(),
  imageUrl:    z.string().url().max(2048).nullable().optional(),
  status:      z.enum(['published', 'cancelled', 'completed']).optional(),
})

export const listEventsSchema = z.object({
  status:  z.enum(['published', 'cancelled', 'completed']).optional(),
  from:    z.string().datetime().optional(),
  search:  z.string().trim().max(100).optional(),
  limit:   z.coerce.number().int().min(1).max(50).default(PAGINATION_DEFAULTS.defaultPageSize),
  page:    z.coerce.number().int().min(1).default(PAGINATION_DEFAULTS.defaultPage),
})
