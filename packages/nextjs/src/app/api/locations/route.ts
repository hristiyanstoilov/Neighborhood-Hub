import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { locations, skills } from '@/db/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'

export async function GET(_req: NextRequest) {
  const rows = await db
    .select({
      id: locations.id,
      city: locations.city,
      neighborhood: locations.neighborhood,
      lat: locations.lat,
      lng: locations.lng,
      skillCount: sql<number>`count(${skills.id})::int`,
    })
    .from(locations)
    .leftJoin(
      skills,
      and(
        eq(skills.locationId, locations.id),
        isNull(skills.deletedAt),
        eq(skills.status, 'available')
      )
    )
    .groupBy(
      locations.id,
      locations.city,
      locations.neighborhood,
      locations.lat,
      locations.lng
    )
    .orderBy(locations.city, locations.neighborhood)

  return NextResponse.json({ data: rows })
}