import { NextRequest, NextResponse } from 'next/server'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { foodReservations, profiles, ratings, skillRequests, toolReservations } from '@/db/schema'
import { apiRatelimit } from '@/lib/ratelimit'
import { createRatingSchema, listRatingsQuerySchema, type RatingContextType } from '@/lib/schemas/rating'
import { requireAuth } from '@/lib/middleware'

type ContextParticipantInfo = {
  participantA: string
  participantB: string
}

function isUniqueViolation(err: unknown): boolean {
  const queue: unknown[] = [err]
  const seen = new Set<unknown>()

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || seen.has(current)) continue
    seen.add(current)

    if (typeof current === 'object') {
      const obj = current as { code?: unknown; message?: unknown; cause?: unknown }
      if (obj.code === '23505') return true
      if (typeof obj.message === 'string' && obj.message.toLowerCase().includes('duplicate key value')) {
        return true
      }
      if ('cause' in obj) queue.push(obj.cause)
    }

    if (current instanceof Error && current.cause) {
      queue.push(current.cause)
    }
  }

  return false
}

async function getContextParticipants(contextType: RatingContextType, contextId: string): Promise<{
  exists: boolean
  isTerminal: boolean
  participants: ContextParticipantInfo | null
}> {
  if (contextType === 'skill_request') {
    const row = await db.query.skillRequests.findFirst({ where: eq(skillRequests.id, contextId) })
    if (!row) return { exists: false, isTerminal: false, participants: null }
    return {
      exists: true,
      isTerminal: row.status === 'completed',
      participants: { participantA: row.userFromId, participantB: row.userToId },
    }
  }

  if (contextType === 'tool_reservation') {
    const row = await db.query.toolReservations.findFirst({ where: eq(toolReservations.id, contextId) })
    if (!row) return { exists: false, isTerminal: false, participants: null }
    return {
      exists: true,
      isTerminal: row.status === 'returned',
      participants: { participantA: row.borrowerId, participantB: row.ownerId },
    }
  }

  const row = await db.query.foodReservations.findFirst({ where: eq(foodReservations.id, contextId) })
  if (!row) return { exists: false, isTerminal: false, participants: null }
  return {
    exists: true,
    isTerminal: row.status === 'picked_up',
    participants: { participantA: row.requesterId, participantB: row.ownerId },
  }
}

export const POST = requireAuth(async (req: NextRequest, { user }) => {
  try {
    const { success } = await apiRatelimit.limit(user.sub)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const body = await req.json().catch(() => null)
    const parsed = createRatingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const payload = parsed.data
    const context = await getContextParticipants(payload.contextType, payload.contextId)

    if (!context.exists || !context.participants) {
      return NextResponse.json({ error: 'CONTEXT_NOT_FOUND' }, { status: 404 })
    }

    if (!context.isTerminal) {
      return NextResponse.json({ error: 'CONTEXT_NOT_TERMINAL' }, { status: 409 })
    }

    const { participantA, participantB } = context.participants
    if (user.sub !== participantA && user.sub !== participantB) {
      return NextResponse.json({ error: 'NOT_A_PARTICIPANT' }, { status: 403 })
    }

    const otherParticipant = user.sub === participantA ? participantB : participantA
    if (payload.ratedUserId !== otherParticipant) {
      return NextResponse.json({ error: 'INVALID_RATED_USER' }, { status: 400 })
    }

    let inserted
    try {
      ;[inserted] = await db
        .insert(ratings)
        .values({
          raterId: user.sub,
          ratedUserId: payload.ratedUserId,
          contextType: payload.contextType,
          contextId: payload.contextId,
          score: payload.score,
          comment: payload.comment ?? null,
        })
        .returning()
    } catch (err) {
      if (isUniqueViolation(err)) {
        return NextResponse.json({ error: 'DUPLICATE_RATING' }, { status: 409 })
      }
      throw err
    }

    const [agg] = await db
      .select({
        avg: sql<string | null>`AVG(${ratings.score})::numeric(3,2)`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(ratings)
      .where(eq(ratings.ratedUserId, payload.ratedUserId))

    await db
      .update(profiles)
      .set({
        avgRating: agg?.avg ?? null,
        ratingCount: agg?.count ?? 0,
      })
      .where(eq(profiles.userId, payload.ratedUserId))

    return NextResponse.json({ data: inserted }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/ratings]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
})

export async function GET(req: NextRequest) {
  try {
    const parsed = listRatingsQuerySchema.safeParse(
      Object.fromEntries(new URL(req.url).searchParams)
    )

    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    const { userId, limit, offset } = parsed.data

    const [rows, [totalRow]] = await Promise.all([
      db
        .select({
          id: ratings.id,
          raterId: ratings.raterId,
          score: ratings.score,
          comment: ratings.comment,
          contextType: ratings.contextType,
          contextId: ratings.contextId,
          createdAt: ratings.createdAt,
          raterName: profiles.name,
          raterAvatarUrl: profiles.avatarUrl,
        })
        .from(ratings)
        .leftJoin(profiles, eq(profiles.userId, ratings.raterId))
        .where(eq(ratings.ratedUserId, userId))
        .orderBy(desc(ratings.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: sql<number>`COUNT(*)::int` })
        .from(ratings)
        .where(eq(ratings.ratedUserId, userId)),
    ])

    return NextResponse.json({
      data: {
        ratings: rows,
        total: totalRow?.total ?? 0,
      },
    })
  } catch (err) {
    console.error('[GET /api/ratings]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
