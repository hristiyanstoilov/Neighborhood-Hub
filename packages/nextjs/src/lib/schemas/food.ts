import { z } from 'zod'

const MIN_PICKUP_LEAD_MS = 60 * 1000

export const createFoodShareSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(5000).optional(),
  quantity: z.coerce.number().int().min(1).max(1000),
  locationId: z.string().uuid().optional(),
  availableUntil: z.string().datetime().optional(),
  pickupInstructions: z.string().trim().max(500).optional(),
  imageUrl: z.string().url().max(2048).optional(),
})

export const updateFoodShareSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  quantity: z.coerce.number().int().min(1).max(1000).optional(),
  locationId: z.string().uuid().nullable().optional(),
  availableUntil: z.string().datetime().nullable().optional(),
  pickupInstructions: z.string().trim().max(500).nullable().optional(),
  imageUrl: z.string().url().max(2048).nullable().optional(),
  status: z.enum(['available', 'reserved', 'picked_up']).optional(),
})

export const listFoodSharesSchema = z.object({
  status: z.enum(['available', 'reserved', 'picked_up']).optional(),
  ownerId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  page: z.coerce.number().int().min(1).default(1),
})

export const createFoodReservationSchema = z.object({
  pickupAt: z
    .string()
    .datetime()
    .refine((value) => new Date(value).getTime() >= Date.now() + MIN_PICKUP_LEAD_MS, {
      message: 'PICKUP_TIME_IN_PAST',
    }),
  notes: z.string().trim().max(500).optional(),
})

export const updateFoodReservationSchema = z.object({
  action: z.enum(['approve', 'reject', 'cancel', 'picked_up']),
  cancellationReason: z.string().trim().max(500).optional(),
})

export const listFoodReservationsSchema = z.object({
  role: z.enum(['requester', 'owner']).default('requester'),
})