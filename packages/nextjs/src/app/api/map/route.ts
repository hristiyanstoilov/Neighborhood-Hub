import { NextRequest, NextResponse } from 'next/server'
import { and, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp } from '@/lib/middleware'
import { events, foodShares, locations, skills, tools } from '@/db/schema'

export type MapMarker = {
  id: string
  type: 'skill' | 'tool' | 'food_share' | 'event'
  title: string
  neighborhood: string
  lat: number
  lng: number
}

function toNumber(value: string | number) {
  return typeof value === 'number' ? value : Number(value)
}

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })
    }

    const [skillRows, toolRows, foodRows, eventRows] = await Promise.all([
      db
        .select({
          id: skills.id,
          title: skills.title,
          neighborhood: locations.neighborhood,
          lat: locations.lat,
          lng: locations.lng,
        })
        .from(skills)
        .innerJoin(locations, eq(locations.id, skills.locationId))
        .where(and(isNull(skills.deletedAt), inArray(skills.status, ['available', 'busy'])))
        .limit(500),
      db
        .select({
          id: tools.id,
          title: tools.title,
          neighborhood: locations.neighborhood,
          lat: locations.lat,
          lng: locations.lng,
        })
        .from(tools)
        .innerJoin(locations, eq(locations.id, tools.locationId))
        .where(isNull(tools.deletedAt))
        .limit(500),
      db
        .select({
          id: foodShares.id,
          title: foodShares.title,
          neighborhood: locations.neighborhood,
          lat: locations.lat,
          lng: locations.lng,
        })
        .from(foodShares)
        .innerJoin(locations, eq(locations.id, foodShares.locationId))
        .where(and(isNull(foodShares.deletedAt), eq(foodShares.status, 'available')))
        .limit(500),
      db
        .select({
          id: events.id,
          title: events.title,
          neighborhood: locations.neighborhood,
          lat: locations.lat,
          lng: locations.lng,
        })
        .from(events)
        .innerJoin(locations, eq(locations.id, events.locationId))
        .where(and(isNull(events.deletedAt), eq(events.status, 'published')))
        .limit(500),
    ])

    const data: MapMarker[] = [
      ...skillRows.map((row) => ({
        id: row.id,
        type: 'skill' as const,
        title: row.title,
        neighborhood: row.neighborhood,
        lat: toNumber(row.lat),
        lng: toNumber(row.lng),
      })),
      ...toolRows.map((row) => ({
        id: row.id,
        type: 'tool' as const,
        title: row.title,
        neighborhood: row.neighborhood,
        lat: toNumber(row.lat),
        lng: toNumber(row.lng),
      })),
      ...foodRows.map((row) => ({
        id: row.id,
        type: 'food_share' as const,
        title: row.title,
        neighborhood: row.neighborhood,
        lat: toNumber(row.lat),
        lng: toNumber(row.lng),
      })),
      ...eventRows.map((row) => ({
        id: row.id,
        type: 'event' as const,
        title: row.title,
        neighborhood: row.neighborhood,
        lat: toNumber(row.lat),
        lng: toNumber(row.lng),
      })),
    ]

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[GET /api/map]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}