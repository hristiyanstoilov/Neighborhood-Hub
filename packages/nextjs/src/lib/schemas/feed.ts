import { z } from 'zod'

export const feedEventTypeSchema = z.enum([
  'skill_listed',
  'tool_listed',
  'food_shared',
  'drive_opened',
  'event_created',
])

export const listFeedSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export const createFeedSchema = z.object({
  eventType: feedEventTypeSchema,
  targetId: z.string().uuid(),
  targetTitle: z.string().trim().min(1).max(220),
  targetUrl: z.string().trim().min(1).max(400),
})
