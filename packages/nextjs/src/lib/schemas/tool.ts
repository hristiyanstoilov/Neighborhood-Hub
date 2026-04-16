import { z } from 'zod'

export const createToolSchema = z.object({
  title:         z.string().min(3).max(200),
  description:   z.string().max(2000).optional(),
  categoryId:    z.string().uuid().optional(),
  locationId:    z.string().uuid().optional(),
  condition:     z.enum(['new', 'good', 'fair', 'worn']).optional(),
  imageUrl:      z.string().url().max(2048).optional(),
})

export const updateToolSchema = createToolSchema.partial().extend({
  status:   z.enum(['available', 'in_use', 'on_loan']).optional(),
  imageUrl: z.string().url().max(2048).nullable().optional(),
})

export const toolStatusSchema = z.object({
  status: z.enum(['available', 'in_use', 'on_loan']),
})

export const listToolsSchema = z.object({
  categoryId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  status:     z.enum(['available', 'in_use', 'on_loan']).optional(),
  search:     z.string().max(100).optional(),
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(50).default(20),
})
