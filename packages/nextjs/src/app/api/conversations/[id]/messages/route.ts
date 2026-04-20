import { NextRequest, NextResponse } from 'next/server'
import { and, desc, eq, inArray, lt, ne, or, sql } from 'drizzle-orm'
import { db } from '@/db'
import { conversations, messages } from '@/db/schema'
import { requireAuth } from '@/lib/middleware'
import { createMessageSchema, listMessagesSchema } from '@/lib/schemas/dm'

function isParticipant(conversation: { participantA: string; participantB: string }, userId: string) {
  return conversation.participantA === userId || conversation.participantB === userId
}

export const GET = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const segments = req.nextUrl.pathname.split('/').filter(Boolean)
    const conversationId = segments[segments.indexOf('conversations') + 1]

    if (!conversationId) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    })

    if (!conversation) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    if (!isParticipant(conversation, user.sub)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    const parsed = listMessagesSchema.safeParse(Object.fromEntries(req.nextUrl.searchParams))
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { limit, before } = parsed.data

    const rows = await db
      .select({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        body: messages.body,
        readAt: messages.readAt,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(and(
        eq(messages.conversationId, conversationId),
        before ? lt(messages.createdAt, new Date(before)) : undefined,
      ))
      .orderBy(desc(messages.createdAt))
      .limit(limit + 1)

    const hasMore = rows.length > limit
    const pageRows = hasMore ? rows.slice(0, limit) : rows

    const unreadIds = pageRows
      .filter((row) => row.senderId !== user.sub && row.readAt === null)
      .map((row) => row.id)

    if (unreadIds.length > 0) {
      await db
        .update(messages)
        .set({ readAt: new Date() })
        .where(and(
          inArray(messages.id, unreadIds),
          ne(messages.senderId, user.sub),
          sql`${messages.readAt} IS NULL`
        ))
    }

    return NextResponse.json({ data: { messages: pageRows, hasMore } })
  } catch (err) {
    console.error('[GET /api/conversations/[id]/messages]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

export const POST = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const segments = req.nextUrl.pathname.split('/').filter(Boolean)
    const conversationId = segments[segments.indexOf('conversations') + 1]

    if (!conversationId) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    })

    if (!conversation) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    if (!isParticipant(conversation, user.sub)) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    const body = await req.json().catch(() => null)
    const parsed = createMessageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const [created] = await db
      .insert(messages)
      .values({
        conversationId,
        senderId: user.sub,
        body: parsed.data.body,
      })
      .returning({
        id: messages.id,
        conversationId: messages.conversationId,
        senderId: messages.senderId,
        body: messages.body,
        readAt: messages.readAt,
        createdAt: messages.createdAt,
      })

    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId))

    return NextResponse.json({ data: { message: created } }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/conversations/[id]/messages]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
