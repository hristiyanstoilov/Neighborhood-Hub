'use server'

import { headers } from 'next/headers'
import { z } from 'zod'
import { sendContactEmail } from '@/lib/email'
import { searchPublicRatelimit } from '@/lib/ratelimit'

const schema = z.object({
  name:    z.string().trim().min(1).max(100),
  email:   z.string().trim().email(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(2000),
})

export type ContactResult =
  | { ok: true }
  | { ok: false; error: 'TOO_MANY_REQUESTS' | 'INVALID_INPUT' | 'FAILED' }

export async function submitContact(
  data: { name: string; email: string; subject: string; message: string },
): Promise<ContactResult> {
  const headersList = await headers()
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    'unknown'

  const { success } = await searchPublicRatelimit.limit(`contact:${ip}`)
  if (!success) return { ok: false, error: 'TOO_MANY_REQUESTS' }

  const parsed = schema.safeParse(data)
  if (!parsed.success) return { ok: false, error: 'INVALID_INPUT' }

  try {
    await sendContactEmail({
      senderName:  parsed.data.name,
      senderEmail: parsed.data.email,
      subject:     parsed.data.subject,
      message:     parsed.data.message,
    })
    return { ok: true }
  } catch {
    return { ok: false, error: 'FAILED' }
  }
}
