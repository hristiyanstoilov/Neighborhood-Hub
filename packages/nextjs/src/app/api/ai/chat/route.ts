import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { db } from '@/db'
import { aiConversations, aiMessages } from '@/db/schema'
import { eq, and, isNull, asc } from 'drizzle-orm'
import { requireAuth } from '@/lib/middleware'
import { aiRatelimit } from '@/lib/ratelimit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a helpful neighborhood assistant for Neighborhood Hub — a platform that connects neighbors to share skills, tools, and time.

You help users:
- Find and request skills from neighbors
- Understand how skill requests work (pending → accepted → completed flow)
- Navigate the platform features: skill listings, requests, profile setup
- Get advice on what skills to offer or how to write a good skill description

You do NOT:
- Have access to any user's personal data, emails, passwords, or private information
- Access real-time data — you cannot see current skill listings or request statuses
- Make bookings or submit requests on behalf of users
- Discuss topics unrelated to the Neighborhood Hub platform and community

Keep responses concise, friendly, and helpful. If asked about something outside your scope, politely redirect to what you can help with.`

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional(),
})

export const POST = requireAuth(async (req: NextRequest, { user }) => {
  // Rate limit per user
  const { success } = await aiRatelimit.limit(user.sub)
  if (!success) {
    return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.flatten() }, { status: 400 })
  }

  const { message, conversationId } = parsed.data

  // Resolve or create conversation
  let convId = conversationId ?? null

  if (convId) {
    // Verify ownership
    const [conv] = await db
      .select({ id: aiConversations.id })
      .from(aiConversations)
      .where(and(
        eq(aiConversations.id, convId),
        eq(aiConversations.userId, user.sub),
        isNull(aiConversations.deletedAt)
      ))
      .limit(1)

    if (!conv) {
      return NextResponse.json({ error: 'CONVERSATION_NOT_FOUND' }, { status: 404 })
    }
  } else {
    // New conversation — derive title from first message (truncated)
    const title = message.length > 80 ? message.slice(0, 77) + '…' : message
    const [newConv] = await db
      .insert(aiConversations)
      .values({ userId: user.sub, title })
      .returning({ id: aiConversations.id })
    convId = newConv.id
  }

  // Load history for context (last 20 messages)
  const history = await db
    .select({ role: aiMessages.role, content: aiMessages.content })
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, convId))
    .orderBy(asc(aiMessages.createdAt))
    .limit(20)

  // Persist user message
  await db.insert(aiMessages).values({
    conversationId: convId,
    role: 'user',
    content: message,
  })

  // Build messages array for Anthropic
  const contextMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message },
  ]

  // Call Anthropic
  let assistantContent: string
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: contextMessages,
    })
    assistantContent = response.content[0].type === 'text' ? response.content[0].text : ''
  } catch {
    return NextResponse.json({ error: 'AI_UNAVAILABLE' }, { status: 503 })
  }

  // Persist assistant message
  const [assistantMsg] = await db
    .insert(aiMessages)
    .values({
      conversationId: convId,
      role: 'assistant',
      content: assistantContent,
    })
    .returning({ id: aiMessages.id, createdAt: aiMessages.createdAt })

  return NextResponse.json({
    data: {
      conversationId: convId,
      message: {
        id: assistantMsg.id,
        role: 'assistant',
        content: assistantContent,
        createdAt: assistantMsg.createdAt,
      },
    },
  })
})