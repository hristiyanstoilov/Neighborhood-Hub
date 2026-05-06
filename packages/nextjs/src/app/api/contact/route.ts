import { NextRequest, NextResponse } from 'next/server'
import { searchPublicRatelimit } from '@/lib/ratelimit'
import { getClientIp } from '@/lib/middleware'
import { sendContactEmail } from '@/lib/email'
import { z } from 'zod'

const schema = z.object({
  name:    z.string().min(1).max(100),
  email:   z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
})

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const { success } = await searchPublicRatelimit.limit(`contact:${ip}`)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
    }

    const { name, email, subject, message } = parsed.data
    await sendContactEmail({ senderName: name, senderEmail: email, subject, message })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/contact]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
