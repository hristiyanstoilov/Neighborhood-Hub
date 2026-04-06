import { z } from 'zod'

export const createSkillRequestSchema = z
  .object({
    skillId: z.string().uuid(),
    scheduledStart: z.string().datetime(),
    scheduledEnd: z.string().datetime(),
    meetingType: z.enum(['in_person', 'online', 'hybrid']),
    meetingUrl: z.string().url().max(2048).optional(),
    notes: z.string().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.meetingType !== 'in_person' && !data.meetingUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['meetingUrl'],
        message: 'Meeting URL is required for online and hybrid sessions.',
      })
    }
    if (new Date(data.scheduledEnd) <= new Date(data.scheduledStart)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scheduledEnd'],
        message: 'Scheduled end must be after scheduled start.',
      })
    }
  })

export const patchSkillRequestSchema = z
  .object({
    action: z.enum(['accept', 'reject', 'complete', 'cancel']),
    cancellationReason: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === 'cancel' && !data.cancellationReason?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cancellationReason'],
        message: 'A cancellation reason is required.',
      })
    }
  })

export const listSkillRequestsSchema = z.object({
  role: z.enum(['requester', 'owner']).optional(),
  status: z.enum(['pending', 'accepted', 'rejected', 'completed', 'cancelled']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})
