import { db } from '@/db'
import { locations, skills } from '@/db/schema'
import { asc, and, eq, isNull, sql } from 'drizzle-orm'

export async function queryLocations() {
  return db
    .select({ id: locations.id, city: locations.city, neighborhood: locations.neighborhood })
    .from(locations)
    .orderBy(asc(locations.city), asc(locations.neighborhood))
}

export async function queryRadarLocations() {
  return db
    .select({
      id: locations.id,
      neighborhood: locations.neighborhood,
      city: locations.city,
      skillCount: sql<number>`count(${skills.id})::int`,
    })
    .from(locations)
    .leftJoin(
      skills,
      and(eq(skills.locationId, locations.id), isNull(skills.deletedAt), eq(skills.status, 'available'))
    )
    .groupBy(locations.id, locations.neighborhood, locations.city)
    .orderBy(asc(locations.city), asc(locations.neighborhood))
}
