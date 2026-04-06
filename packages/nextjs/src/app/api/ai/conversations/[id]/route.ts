import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { aiConversations, aiMessages } from '@/db/schema'
import { eq, and, isNull, asc } from 'drizzle-orm'
import { requireAuth } from '@/lib/middleware'
import { apiRatelimit } from '@/lib/ratelimit'

type Ctx = { params: Promise<{ id: string }> }

export const GET = requireAuth(async (req: NextRequest, { user }) => {
  const { success } = await apiRatelimit.limit(user.sub)
  if (!success) {
    return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
  }

  const url = new URL(req.url)
  const id = url.pathname.split('/').at(-1)!

  const [conv] = await db
    .select({ id: aiConversations.id, title: aiConversations.title })
    .from(aiConversations)
    .where(and(
      eq(aiConversations.id, id),
      eq(aiConversations.userId, user.sub),
      isNull(aiConversations.deletedAt)
    ))
    .limit(1)

  if (!conv) {
    return NextResponse.json({ error: 'CONVERSATION_NOT_FOUND' }, { status: 404 })
  }

  const messages = await db
    .select({
      id: aiMessages.id,
      role: aiMessages.role,
      content: aiMessages.content,
      createdAt: aiMessages.createdAt,
    })
    .from(aiMessages)
    .where(eq(aiMessages.conversationId, id))
    .orderBy(asc(aiMessages.createdAt))

  return NextResponse.json({ data: { conversation: conv, messages } })
})

export const DELETE = requireAuth(async (req: NextRequest, { user }) => {
  const { success } = await apiRatelimit.limit(user.sub)
  if (!success) {
    return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
  }

  const url = new URL(req.url)
  const id = url.pathname.split('/').at(-1)!

  const [conv] = await db
    .select({ id: aiConversations.id })
    .from(aiConversations)
    .where(and(
      eq(aiConversations.id, id),
      eq(aiConversations.userId, user.sub),
      isNull(aiConversations.deletedAt)
    ))
    .limit(1)

  if (!conv) {
    return NextResponse.json({ error: 'CONVERSATION_NOT_FOUND' }, { status: 404 })
  }

  await db
    .update(aiConversations)
    .set({ deletedAt: new Date() })
    .where(eq(aiConversations.id, id))

  return NextResponse.json({ data: { deleted: true } })
})
