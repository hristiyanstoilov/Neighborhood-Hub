import { z } from 'zod'
import { PAGINATION_DEFAULTS } from '@/lib/query-defaults'

export const feedEventTypeSchema = z.enum([
  'skill_listed',
  'tool_listed',
  'food_shared',
  'drive_opened',
  'event_created',
])

export const listFeedSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(PAGINATION_DEFAULTS.defaultPageSize),
  page: z.coerce.number().int().min(1).default(PAGINATION_DEFAULTS.defaultPage),
})

export const createFeedSchema = z.object({
  eventType: feedEventTypeSchema,
  targetId: z.string().uuid(),
  targetTitle: z.string().trim().min(1).max(220),
  targetUrl: z.string().trim().min(1).max(400).startsWith('/'),
})
