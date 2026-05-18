import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { db } from '@/db'
import { aiConversations, aiMessages, profiles, locations, skills, users } from '@/db/schema'
import { eq, and, isNull, asc, count } from 'drizzle-orm'
import { requireVerifiedAuth } from '@/lib/middleware'
import { aiRatelimit } from '@/lib/ratelimit'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const BASE_SYSTEM_PROMPT = `You are a helpful neighborhood assistant for Neighborhood Hub — a platform that connects neighbors in Bulgarian neighborhoods to share skills, time, and expertise.

You help users:
- Find and request skills from neighbors
- Understand how skill requests work (pending → accepted → completed flow)
- Navigate the platform features: skill listings, requests, profile setup, radar map
- Get advice on what skills to offer or how to write a good skill description
- Understand the neighborhood radar map (interactive map showing skill counts per neighborhood)

You do NOT:
- Have access to passwords, payment data, or any sensitive private information
- Access real-time listings — you cannot see current skill availability or request statuses
- Make bookings or submit requests on behalf of users
- Discuss topics unrelated to the Neighborhood Hub platform and community
- Provide professional advice of any kind — not legal, medical, financial, psychological, or otherwise

Important: If a user asks for advice that touches on legal, medical, financial, or personal safety matters, always include this disclaimer: "Note: This is for informational purposes only and is not professional advice. Please consult a qualified professional."

Keep responses concise, friendly, and helpful. If asked about something outside your scope, politely redirect to what you can help with.`

async function buildSystemPrompt(userId: string): Promise<string> {
  try {
    const [profileRows, userRows, skillCountRows] = await Promise.all([
      db
        .select({
          name: profiles.name,
          locationNeighborhood: locations.neighborhood,
          locationCity: locations.city,
        })
        .from(profiles)
        .leftJoin(locations, eq(locations.id, profiles.locationId))
        .where(eq(profiles.userId, userId))
        .limit(1),
      db
        .select({ emailVerifiedAt: users.emailVerifiedAt })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1),
      db
        .select({ skillCount: count() })
        .from(skills)
        .where(and(eq(skills.ownerId, userId), isNull(skills.deletedAt))),
    ])

    const profileRow = profileRows[0]
    const userRow = userRows[0]
    const { skillCount } = skillCountRows[0]

    const name = profileRow?.name ?? 'neighbor'
    const neighborhood = profileRow?.locationNeighborhood
      ? `${profileRow.locationNeighborhood}, ${profileRow.locationCity ?? 'Sofia'}`
      : null
    const verified = !!userRow?.emailVerifiedAt

    const contextLines = [
      `\n\n--- Current user context ---`,
      `Name: ${name}`,
      neighborhood ? `Neighborhood: ${neighborhood}` : `Neighborhood: not set`,
      `Email verified: ${verified ? 'yes' : 'no — cannot create skill listings until verified'}`,
      `Skills offered: ${skillCount}`,
      `---`,
    ]

    return BASE_SYSTEM_PROMPT + contextLines.join('\n')
  } catch (e) {
    console.error('[ai/chat] buildSystemPrompt DB fail, using base prompt', e)
    return BASE_SYSTEM_PROMPT
  }
}

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().uuid().optional(),
})

export const POST = requireVerifiedAuth(async (req: NextRequest, { user }) => {
  try {
    // Rate limit per user
    const { success } = await aiRatelimit.limit(user.sub)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const body = await req.json().catch(() => null)
    if (body === null) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
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

    // Persist user message before calling Anthropic so it appears in history
    const [persistedUserMsg] = await db
      .insert(aiMessages)
      .values({ conversationId: convId, role: 'user', content: message })
      .returning({ id: aiMessages.id })

    // Build messages array for Anthropic
    const contextMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: message },
    ]

    // Build personalised system prompt (includes user context from DB)
    const systemPrompt = await buildSystemPrompt(user.sub)

    // Call Anthropic — 9 s timeout keeps us under Netlify's 10 s serverless limit
    let assistantContent: string
    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages: contextMessages,
      }, { timeout: 9000 })
      assistantContent = response.content[0].type === 'text' ? response.content[0].text : ''
    } catch {
      // Compensating delete: remove the persisted user message so retry starts clean
      await db.delete(aiMessages).where(eq(aiMessages.id, persistedUserMsg.id)).catch((e) => console.error('[ai/chat] compensating delete failed', e))
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
  } catch (err) {
    console.error('[POST /api/ai/chat]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})