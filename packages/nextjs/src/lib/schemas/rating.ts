import { z } from 'zod'

export const ratingContextTypeSchema = z.enum([
  'skill_request',
  'tool_reservation',
  'food_reservation',
])

export const createRatingSchema = z.object({
  contextType: ratingContextTypeSchema,
  contextId: z.string().uuid(),
  ratedUserId: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
})

export const listRatingsQuerySchema = z.object({
  userId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export const checkRatingQuerySchema = z.object({
  contextType: ratingContextTypeSchema,
  contextId: z.string().uuid(),
})

export type RatingContextType = z.infer<typeof ratingContextTypeSchema>
