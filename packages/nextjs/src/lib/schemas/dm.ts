import { z } from 'zod'

export const listMessagesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  before: z.string().datetime().optional(),
})

export const createConversationSchema = z.object({
  otherUserId: z.string().uuid(),
})

export const createMessageSchema = z.object({
  body: z.string().trim().min(1).max(2000),
})
