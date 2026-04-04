import { z } from 'zod'

export const uuidSchema = z.string().uuid()

export const createSkillSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  categoryId: z.string().uuid().optional(),
  availableHours: z.number().int().min(0).max(168),
  imageUrl: z.string().url().max(2048).optional(),
  locationId: z.string().uuid().optional(),
})

export const updateSkillSchema = createSkillSchema.partial()

export const skillStatusSchema = z.object({
  status: z.enum(['available', 'busy', 'retired']),
})

export const listSkillsSchema = z.object({
  categoryId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  status: z.enum(['available', 'busy', 'retired']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})
