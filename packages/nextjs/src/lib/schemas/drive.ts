import { z } from 'zod'

export const createDriveSchema = z.object({
  title:            z.string().trim().min(3).max(200),
  description:      z.string().trim().max(5000).optional(),
  driveType:        z.enum(['items', 'money', 'food', 'other']),
  goalDescription:  z.string().trim().max(500).optional(),
  dropOffAddress:   z.string().trim().max(300).optional(),
  deadline:         z.string().datetime().optional(),
  imageUrl:         z.string().url().max(2048).optional(),
})

export const updateDriveSchema = z.object({
  title:            z.string().trim().min(3).max(200).optional(),
  description:      z.string().trim().max(5000).nullable().optional(),
  driveType:        z.enum(['items', 'money', 'food', 'other']).optional(),
  goalDescription:  z.string().trim().max(500).nullable().optional(),
  dropOffAddress:   z.string().trim().max(300).nullable().optional(),
  deadline:         z.string().datetime().nullable().optional(),
  imageUrl:         z.string().url().max(2048).nullable().optional(),
  status:           z.enum(['open', 'completed', 'cancelled']).optional(),
})

export const listDrivesSchema = z.object({
  status:    z.enum(['open', 'completed', 'cancelled']).optional(),
  driveType: z.enum(['items', 'money', 'food', 'other']).optional(),
  limit:     z.coerce.number().int().min(1).max(50).default(20),
  page:      z.coerce.number().int().min(1).default(1),
})

export const createPledgeSchema = z.object({
  pledgeDescription: z.string().trim().min(1).max(500),
})

export const updatePledgeSchema = z.object({
  status: z.enum(['fulfilled', 'cancelled']),
})
