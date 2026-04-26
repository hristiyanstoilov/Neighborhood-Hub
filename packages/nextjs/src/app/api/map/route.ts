import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { skills, tools, foodShares, events, locations } from '@/db/schema'
import { eq, isNull } from 'drizzle-orm'
import { apiRatelimit } from '@/lib/ratelimit'
import { getClientIp } from '@/lib/middleware'

export type MapMarker = {
  id: string
  type: 'skill' | 'tool' | 'food_share' | 'event'
  title: string
  lat: number
  lng: number
  status: string
  neighborhood: string
}

export async function GET(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const { success } = await apiRatelimit.limit(ip)
    if (!success) return NextResponse.json({ error: 'TOO_MANY_REQUESTS' }, { status: 429 })

    const [skillRows, toolRows, foodRows, eventRows] = await Promise.all([
      db
        .select({ id: skills.id, title: skills.title, status: skills.status, lat: locations.lat, lng: locations.lng, neighborhood: locations.neighborhood })
        .from(skills)
        .innerJoin(locations, eq(skills.locationId, locations.id))
        .where(isNull(skills.deletedAt)),

      db
        .select({ id: tools.id, title: tools.title, status: tools.status, lat: locations.lat, lng: locations.lng, neighborhood: locations.neighborhood })
        .from(tools)
        .innerJoin(locations, eq(tools.locationId, locations.id))
        .where(isNull(tools.deletedAt)),

      db
        .select({ id: foodShares.id, title: foodShares.title, status: foodShares.status, lat: locations.lat, lng: locations.lng, neighborhood: locations.neighborhood })
        .from(foodShares)
        .innerJoin(locations, eq(foodShares.locationId, locations.id))
        .where(isNull(foodShares.deletedAt)),

      db
        .select({ id: events.id, title: events.title, status: events.status, lat: locations.lat, lng: locations.lng, neighborhood: locations.neighborhood })
        .from(events)
        .innerJoin(locations, eq(events.locationId!, locations.id))
        .where(isNull(events.deletedAt)),
    ])

    const toMarker = (type: MapMarker['type']) =>
      (row: { id: string; title: string; status: string; lat: string; lng: string; neighborhood: string }): MapMarker => ({
        id: row.id,
        type,
        title: row.title,
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
        status: row.status,
        neighborhood: row.neighborhood,
      })

    const markers: MapMarker[] = [
      ...skillRows.map(toMarker('skill')),
      ...toolRows.map(toMarker('tool')),
      ...foodRows.map(toMarker('food_share')),
      ...eventRows.map(toMarker('event')),
    ]

    return NextResponse.json({ data: markers }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
    })
  } catch (err) {
    console.error('[GET /api/map]', err)
    return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
