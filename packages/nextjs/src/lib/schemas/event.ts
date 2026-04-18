import { z } from 'zod'

export const createEventSchema = z.object({
  title:       z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  locationId:  z.string().uuid().optional(),
  address:     z.string().max(300).optional(),
  startsAt:    z.string().datetime(),
  endsAt:      z.string().datetime().optional(),
  maxCapacity: z.coerce.number().int().min(1).optional(),
  imageUrl:    z.string().url().max(2048).optional(),
})

export const updateEventSchema = z.object({
  title:       z.string().min(3).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  locationId:  z.string().uuid().nullable().optional(),
  address:     z.string().max(300).nullable().optional(),
  startsAt:    z.string().datetime().optional(),
  endsAt:      z.string().datetime().nullable().optional(),
  maxCapacity: z.coerce.number().int().min(1).nullable().optional(),
  imageUrl:    z.string().url().max(2048).nullable().optional(),
  status:      z.enum(['published', 'cancelled', 'completed']).optional(),
})

export const listEventsSchema = z.object({
  status:  z.enum(['published', 'cancelled', 'completed']).optional(),
  from:    z.string().datetime().optional(),
  limit:   z.coerce.number().int().min(1).max(50).default(20),
  page:    z.coerce.number().int().min(1).default(1),
})
