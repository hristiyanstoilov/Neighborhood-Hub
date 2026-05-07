import { NextRequest, NextResponse } from 'next/server'
import { and, count, desc, eq, isNull, ne } from 'drizzle-orm'
import { db } from '@/db'
import { conversations, messages, profiles, users } from '@/db/schema'
import { requireAuthWithRateLimit } from '@/lib/middleware'

export const GET = requireAuthWithRateLimit(async (
  req: NextRequest,
  { params, user }
) => {
  try {
    const conversationId = params.id as string

    // Fetch conversation with both participants
    const [convo] = await db
      .select({
        id: conversations.id,
        participantA: conversations.participantA,
        participantB: conversations.participantB,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
      })
      .from(conversations)
      .where(eq(conversations.id, conversationId))

    if (!convo) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    }

    // Check that current user is a participant
    const currentUserIsParticipant = convo.participantA === user.sub || convo.participantB === user.sub
    if (!currentUserIsParticipant) {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    }

    // Determine other participant
    const otherUserId = convo.participantA === user.sub ? convo.participantB : convo.participantA

    // Fetch other user's profile
    const [otherProfile] = await db
      .select({
        userId: profiles.userId,
        name: profiles.name,
        avatarUrl: profiles.avatarUrl,
      })
      .from(profiles)
      .where(eq(profiles.userId, otherUserId))

    // Fetch unread count
    const [unreadResult] = await db
      .select({ unreadCount: count() })
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          ne(messages.senderId, user.sub),
          isNull(messages.readAt)
        )
      )

    // Fetch last message
    const [lastMessage] = await db
      .select({
        body: messages.body,
        createdAt: messages.createdAt,
        senderId: messages.senderId,
      })
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(1)

    return NextResponse.json({
      data: {
        id: convo.id,
        otherUserId,
        otherUserName: otherProfile?.name ?? 'Neighbor',
        otherUserAvatarUrl: otherProfile?.avatarUrl ?? null,
        lastMessage: lastMessage ? {
          body: lastMessage.body,
          createdAt: lastMessage.createdAt,
          senderId: lastMessage.senderId,
        } : null,
        unreadCount: Number(unreadResult?.unreadCount ?? 0),
        createdAt: convo.createdAt,
        updatedAt: convo.updatedAt,
      },
    })
  } catch (err) {
    console.error('[GET /api/conversations/[id]]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
