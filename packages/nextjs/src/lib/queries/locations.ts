import { db } from '@/db'
import { locations } from '@/db/schema'
import { asc } from 'drizzle-orm'

export async function queryLocations() {
  return db
    .select({ id: locations.id, city: locations.city, neighborhood: locations.neighborhood })
    .from(locations)
    .orderBy(asc(locations.city), asc(locations.neighborhood))
}
