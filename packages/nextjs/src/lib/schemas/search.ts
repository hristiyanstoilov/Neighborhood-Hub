import { z } from 'zod'

export const searchTypeValues = ['skills', 'tools', 'events', 'drives', 'food'] as const
export const searchTypeSchema = z.enum(searchTypeValues)

export const listSearchSchema = z.object({
  q: z.string().trim().min(2).max(120),
  types: z.string().optional(),
  locationId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(20).default(5),
})

export type SearchType = z.infer<typeof searchTypeSchema>
