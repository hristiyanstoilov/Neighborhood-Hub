import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { aiConversations } from '@/db/schema'
import { eq, and, isNull, desc } from 'drizzle-orm'
import { requireAuth } from '@/lib/middleware'
import { apiRatelimit } from '@/lib/ratelimit'

export const GET = requireAuth(async (req: NextRequest, { user }) => {
  const { success } = await apiRatelimit.limit(user.sub)
  if (!success) {
    return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
  }

  const rows = await db
    .select({
      id: aiConversations.id,
      title: aiConversations.title,
      createdAt: aiConversations.createdAt,
      updatedAt: aiConversations.updatedAt,
    })
    .from(aiConversations)
    .where(and(
      eq(aiConversations.userId, user.sub),
      isNull(aiConversations.deletedAt)
    ))
    .orderBy(desc(aiConversations.updatedAt))
    .limit(50)

  return NextResponse.json({ data: rows })
})
