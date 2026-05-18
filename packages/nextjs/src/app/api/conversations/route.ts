import { NextRequest, NextResponse } from 'next/server'
import { and, count, desc, eq, inArray, isNull, ne, or } from 'drizzle-orm'
import { db } from '@/db'
import { conversations, messages, profiles, userBlocks, users } from '@/db/schema'
import { requireAuthWithRateLimit, requireVerifiedAuthWithRateLimit } from '@/lib/middleware'
import { DEFAULT_PROFILE_NAME } from '@/lib/constants'
import { createConversationSchema } from '@/lib/schemas/dm'
import { isBlocked } from '@/lib/queries/blocks'

function normalizePair(a: string, b: string): { participantA: string; participantB: string } {
  return a < b ? { participantA: a, participantB: b } : { participantA: b, participantB: a }
}

export const GET = requireAuthWithRateLimit(async (req: NextRequest, { user }) => {
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

    const allOtherUserIds = rows.map((row) => (row.participantA === user.sub ? row.participantB : row.participantA))

    const blockedEntries = await db
      .select({ blockerId: userBlocks.blockerId, blockedId: userBlocks.blockedId })
      .from(userBlocks)
      .where(or(
        and(eq(userBlocks.blockerId, user.sub), inArray(userBlocks.blockedId, allOtherUserIds)),
        and(eq(userBlocks.blockedId, user.sub), inArray(userBlocks.blockerId, allOtherUserIds)),
      ))

    const blockedUserSet = new Set(
      blockedEntries.map((b) => (b.blockerId === user.sub ? b.blockedId : b.blockerId))
    )

    const visibleRows = rows.filter((row) => {
      const otherId = row.participantA === user.sub ? row.participantB : row.participantA
      return !blockedUserSet.has(otherId)
    })

    if (visibleRows.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const conversationIds = visibleRows.map((row) => row.id)
    const otherUserIds = visibleRows.map((row) => (row.participantA === user.sub ? row.participantB : row.participantA))

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

    const data = visibleRows.map((row) => {
      const otherUserId = row.participantA === user.sub ? row.participantB : row.participantA
      return {
        id: row.id,
        otherUserId,
        otherUserName: profileByUserId.get(otherUserId) ?? DEFAULT_PROFILE_NAME,
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

export const POST = requireVerifiedAuthWithRateLimit(async (req: NextRequest, { user }) => {
  try {
    const body = await req.json().catch(() => null)
    if (body === null) return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
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

    if (await isBlocked(user.sub, otherUserId)) {
      return NextResponse.json({ error: 'BLOCKED' }, { status: 403 })
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

    if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
    return NextResponse.json({ data: { conversationId: existing.id } })
  } catch (err) {
    console.error('[POST /api/conversations]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})
