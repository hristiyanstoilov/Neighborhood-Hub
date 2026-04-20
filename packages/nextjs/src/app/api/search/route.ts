import { NextRequest, NextResponse } from 'next/server'
import { and, eq, isNull, ne, sql } from 'drizzle-orm'
import { db } from '@/db'
import { communityDrives, events, foodShares, locations, profiles, skills, tools } from '@/db/schema'
import { verifyAccessToken } from '@/lib/auth'
import { getClientIp } from '@/lib/middleware'
import { searchPublicRatelimit, searchUserRatelimit } from '@/lib/ratelimit'
import { listSearchSchema, searchTypeValues, type SearchType } from '@/lib/schemas/search'

type SearchResponseData = {
  query: string
  skills: Array<Record<string, unknown>>
  tools: Array<Record<string, unknown>>
  events: Array<Record<string, unknown>>
  drives: Array<Record<string, unknown>>
  food: Array<Record<string, unknown>>
  totalByType: {
    skills: number
    tools: number
    events: number
    drives: number
    food: number
  }
}

function parseTypes(value: string | undefined): SearchType[] {
  if (!value) return [...searchTypeValues]

  const unique = Array.from(new Set(value.split(',').map((item) => item.trim()).filter(Boolean)))
  if (unique.length === 0) return [...searchTypeValues]

  for (const item of unique) {
    if (!searchTypeValues.includes(item as SearchType)) {
      throw new Error('INVALID_TYPES')
    }
  }

  return unique as SearchType[]
}

function getRateLimitKey(req: NextRequest): string {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return getClientIp(req)
  }

  try {
    const token = authHeader.slice(7)
    const payload = verifyAccessToken(token)
    return `user:${payload.sub}`
  } catch {
    return getClientIp(req)
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const parsed = listSearchSchema.safeParse(Object.fromEntries(searchParams))
    if (!parsed.success) {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: parsed.error.issues }, { status: 400 })
    }

    let types: SearchType[]
    try {
      types = parseTypes(parsed.data.types)
    } catch {
      return NextResponse.json({ error: 'VALIDATION_ERROR', details: [{ path: ['types'], message: 'Invalid types list' }] }, { status: 400 })
    }

    const { q, locationId, limit } = parsed.data
    const rateLimitKey = getRateLimitKey(req)
    const isUserKey = rateLimitKey.startsWith('user:')
    const { success } = isUserKey
      ? await searchUserRatelimit.limit(rateLimitKey)
      : await searchPublicRatelimit.limit(rateLimitKey)

    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const payload: SearchResponseData = {
      query: q,
      skills: [],
      tools: [],
      events: [],
      drives: [],
      food: [],
      totalByType: {
        skills: 0,
        tools: 0,
        events: 0,
        drives: 0,
        food: 0,
      },
    }

    const jobs: Array<Promise<void>> = []

    if (types.includes('skills')) {
      jobs.push((async () => {
        const skillRankExpr = sql<number>`ts_rank("skills"."search_vector", plainto_tsquery('english', ${q}))`

        const rows = await db
          .select({
            id: skills.id,
            type: sql<string>`'skill'`,
            title: skills.title,
            description: skills.description,
            status: skills.status,
            ownerId: skills.ownerId,
            ownerName: profiles.name,
            locationId: skills.locationId,
            locationNeighborhood: locations.neighborhood,
            locationCity: locations.city,
            rank: skillRankExpr,
          })
          .from(skills)
          .leftJoin(profiles, eq(profiles.userId, skills.ownerId))
          .leftJoin(locations, eq(locations.id, skills.locationId))
          .where(and(
            sql`"skills"."search_vector" @@ plainto_tsquery('english', ${q})`,
            isNull(skills.deletedAt),
            locationId ? eq(skills.locationId, locationId) : undefined,
          ))
          .orderBy(sql`${skillRankExpr} DESC`)
          .limit(limit)

        payload.skills = rows
        payload.totalByType.skills = rows.length
      })())
    }

    if (types.includes('tools')) {
      jobs.push((async () => {
        const toolRankExpr = sql<number>`ts_rank("tools"."search_vector", plainto_tsquery('english', ${q}))`

        const rows = await db
          .select({
            id: tools.id,
            type: sql<string>`'tool'`,
            title: tools.title,
            description: tools.description,
            status: tools.status,
            ownerId: tools.ownerId,
            ownerName: profiles.name,
            condition: tools.condition,
            locationId: tools.locationId,
            locationNeighborhood: locations.neighborhood,
            locationCity: locations.city,
            rank: toolRankExpr,
          })
          .from(tools)
          .leftJoin(profiles, eq(profiles.userId, tools.ownerId))
          .leftJoin(locations, eq(locations.id, tools.locationId))
          .where(and(
            sql`"tools"."search_vector" @@ plainto_tsquery('english', ${q})`,
            isNull(tools.deletedAt),
            locationId ? eq(tools.locationId, locationId) : undefined,
          ))
          .orderBy(sql`${toolRankExpr} DESC`)
          .limit(limit)

        payload.tools = rows
        payload.totalByType.tools = rows.length
      })())
    }

    if (types.includes('events')) {
      jobs.push((async () => {
        const eventRankExpr = sql<number>`ts_rank("events"."search_vector", plainto_tsquery('english', ${q}))`

        const rows = await db
          .select({
            id: events.id,
            type: sql<string>`'event'`,
            title: events.title,
            description: events.description,
            status: events.status,
            startsAt: events.startsAt,
            endsAt: events.endsAt,
            address: events.address,
            maxCapacity: events.maxCapacity,
            organizerId: events.organizerId,
            locationId: events.locationId,
            locationNeighborhood: locations.neighborhood,
            locationCity: locations.city,
            rank: eventRankExpr,
          })
          .from(events)
          .leftJoin(locations, eq(locations.id, events.locationId))
          .where(and(
            sql`"events"."search_vector" @@ plainto_tsquery('english', ${q})`,
            isNull(events.deletedAt),
            ne(events.status, 'cancelled'),
            locationId ? eq(events.locationId, locationId) : undefined,
          ))
          .orderBy(sql`${eventRankExpr} DESC`)
          .limit(limit)

        payload.events = rows
        payload.totalByType.events = rows.length
      })())
    }

    if (types.includes('drives')) {
      jobs.push((async () => {
        const driveRankExpr = sql<number>`ts_rank("community_drives"."search_vector", plainto_tsquery('english', ${q}))`

        const rows = await db
          .select({
            id: communityDrives.id,
            type: sql<string>`'drive'`,
            title: communityDrives.title,
            description: communityDrives.description,
            driveType: communityDrives.driveType,
            status: communityDrives.status,
            deadline: communityDrives.deadline,
            organizerId: communityDrives.organizerId,
            dropOffAddress: communityDrives.dropOffAddress,
            rank: driveRankExpr,
          })
          .from(communityDrives)
          .where(and(
            sql`"community_drives"."search_vector" @@ plainto_tsquery('english', ${q})`,
            isNull(communityDrives.deletedAt),
            ne(communityDrives.status, 'cancelled'),
          ))
          .orderBy(sql`${driveRankExpr} DESC`)
          .limit(limit)

        payload.drives = rows
        payload.totalByType.drives = rows.length
      })())
    }

    if (types.includes('food')) {
      jobs.push((async () => {
        const foodRankExpr = sql<number>`ts_rank("food_shares"."search_vector", plainto_tsquery('simple', ${q}))`

        const rows = await db
          .select({
            id: foodShares.id,
            type: sql<string>`'food'`,
            title: foodShares.title,
            description: foodShares.description,
            quantity: foodShares.quantity,
            status: foodShares.status,
            availableUntil: foodShares.availableUntil,
            ownerId: foodShares.ownerId,
            locationId: foodShares.locationId,
            locationNeighborhood: locations.neighborhood,
            locationCity: locations.city,
            rank: foodRankExpr,
          })
          .from(foodShares)
          .leftJoin(locations, eq(locations.id, foodShares.locationId))
          .where(and(
            sql`"food_shares"."search_vector" @@ plainto_tsquery('simple', ${q})`,
            isNull(foodShares.deletedAt),
            locationId ? eq(foodShares.locationId, locationId) : undefined,
          ))
          .orderBy(sql`${foodRankExpr} DESC`)
          .limit(limit)

        payload.food = rows
        payload.totalByType.food = rows.length
      })())
    }

    await Promise.all(jobs)

    return NextResponse.json({ data: payload })
  } catch (err) {
    console.error('[GET /api/search]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
