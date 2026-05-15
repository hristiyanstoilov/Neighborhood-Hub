import { z } from 'zod'
import { PAGINATION_DEFAULTS } from '@/lib/query-defaults'

export const createDriveSchema = z.object({
  title:            z.string().trim().min(3).max(200),
  description:      z.string().trim().max(5000).optional(),
  driveType:        z.enum(['items', 'money', 'food', 'other', 'volunteer']),
  goalDescription:  z.string().trim().max(500).optional(),
  goalAmount:       z.coerce.number().int().min(1).optional(),
  currentAmount:    z.coerce.number().int().min(0).optional(),
  dropOffAddress:   z.string().trim().max(300).optional(),
  deadline:         z.string().datetime().refine((v) => new Date(v) > new Date(), 'deadline must be in the future').optional(),
  imageUrl:         z.string().url().max(2048).optional(),
})

export const updateDriveSchema = z.object({
  title:            z.string().trim().min(3).max(200).optional(),
  description:      z.string().trim().max(5000).nullable().optional(),
  driveType:        z.enum(['items', 'money', 'food', 'other', 'volunteer']).optional(),
  goalDescription:  z.string().trim().max(500).nullable().optional(),
  goalAmount:       z.coerce.number().int().min(1).nullable().optional(),
  currentAmount:    z.coerce.number().int().min(0).nullable().optional(),
  dropOffAddress:   z.string().trim().max(300).nullable().optional(),
  deadline:         z.string().datetime().refine((v) => new Date(v) > new Date(), 'deadline must be in the future').nullable().optional(),
  imageUrl:         z.string().url().max(2048).nullable().optional(),
  status:           z.enum(['open', 'completed', 'cancelled']).optional(),
})

export const listDrivesSchema = z.object({
  status:    z.enum(['open', 'completed', 'cancelled']).optional(),
  driveType: z.enum(['items', 'money', 'food', 'other', 'volunteer']).optional(),
  limit:     z.coerce.number().int().min(1).max(50).default(PAGINATION_DEFAULTS.defaultPageSize),
  page:      z.coerce.number().int().min(1).default(PAGINATION_DEFAULTS.defaultPage),
})

export const createPledgeSchema = z.object({
  pledgeDescription: z.string().trim().min(1).max(500),
})

export const updatePledgeSchema = z.object({
  status: z.enum(['fulfilled', 'cancelled']),
})
