import { NextRequest, NextResponse } from 'next/server'
import { and, count, desc, eq, inArray, isNull, ne, or } from 'drizzle-orm'
import { db } from '@/db'
import { conversations, messages, profiles, users } from '@/db/schema'
import { requireAuth } from '@/lib/middleware'
import { createConversationSchema } from '@/lib/schemas/dm'

function normalizePair(a: string, b: string): { participantA: string; participantB: string } {
  return a < b ? { participantA: a, participantB: b } : { participantA: b, participantB: a }
}

export const GET = requireAuth(async (_req: NextRequest, { user }) => {
  try {
    const rows = await db
      .select({
        id: conversations.id,
        participantA: conversations.participantA,
        participantB: conversations.participantB,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .where(or(eq(conversations.participantA, user.sub), eq(conversations.participantB, user.sub)))
      .orderBy(desc(conversations.updatedAt))

    if (rows.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const conversationIds = rows.map((row) => row.id)
    const otherUserIds = rows.map((row) => (row.participantA === user.sub ? row.participantB : row.participantA))

    const [otherProfiles, unreadRows] = await Promise.all([
      db
        .select({
          userId: profiles.userId,
          name: profiles.name,
        })
        .from(profiles)
        .where(inArray(profiles.userId, otherUserIds)),
      db
        .select({
          conversationId: messages.conversationId,
          unreadCount: count(),
        })
        .from(messages)
        .where(and(
          inArray(messages.conversationId, conversationIds),
          ne(messages.senderId, user.sub),
          isNull(messages.readAt)
        ))
        .groupBy(messages.conversationId),
    ])

    const latestMessageRows = await db
      .selectDistinctOn([messages.conversationId], {
        conversationId: messages.conversationId,
        body: messages.body,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(inArray(messages.conversationId, conversationIds))
      .orderBy(messages.conversationId, desc(messages.createdAt))

    const profileByUserId = new Map(otherProfiles.map((profile) => [profile.userId, profile.name]))
    const lastMessageByConversation = new Map(
      latestMessageRows.map((message) => [
        message.conversationId,
        { body: message.body, createdAt: message.createdAt },
      ])
    )
    const unreadByConversation = new Map(unreadRows.map((row) => [row.conversationId, Number(row.unreadCount)]))

    const data = rows.map((row) => {
      const otherUserId = row.participantA === user.sub ? row.participantB : row.participantA
      return {
        id: row.id,
        otherUserId,
        otherUserName: profileByUserId.get(otherUserId) ?? 'Neighbor',
        lastMessage: lastMessageByConversation.get(row.id) ?? null,
        unreadCount: unreadByConversation.get(row.id) ?? 0,
      }
    })

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/conversations]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

export const POST = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json().catch(() => null)
    const parsed = createConversationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { otherUserId } = parsed.data

    if (otherUserId === user.sub) {
      return NextResponse.json({ error: 'CANNOT_MESSAGE_SELF' }, { status: 400 })
    }

    const otherUser = await db.query.users.findFirst({ where: eq(users.id, otherUserId) })
    if (!otherUser || otherUser.deletedAt) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 })
    }

    const { participantA, participantB } = normalizePair(user.sub, otherUserId)

    const [created] = await db
      .insert(conversations)
      .values({ participantA, participantB })
      .onConflictDoNothing()
      .returning({ id: conversations.id })

    if (created) {
      return NextResponse.json({ data: { conversationId: created.id } }, { status: 201 })
    }

    const existing = await db.query.conversations.findFirst({
      where: and(eq(conversations.participantA, participantA), eq(conversations.participantB, participantB)),
    })

    return NextResponse.json({ data: { conversationId: existing!.id } })
  } catch (err) {
    console.error('[POST /api/conversations]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
