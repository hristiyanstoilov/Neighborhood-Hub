import { db } from '@/db'
import { locations, skills } from '@/db/schema'
import { eq, and, isNull, sql } from 'drizzle-orm'
import RadarLoader from './radar-loader'

export const dynamic = 'force-dynamic'

export default async function RadarPage() {
  let locationData: Array<{
    id: string
    city: string
    neighborhood: string
    lat: string
    lng: string
    skillCount: number
  }> = []

  try {
    locationData = await db
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
  } catch {
    // non-critical — map still renders without data
  }

  const totalSkills = locationData.reduce((sum, l) => sum + l.skillCount, 0)
  const activeNeighborhoods = locationData.filter((l) => l.skillCount > 0).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Neighborhood Radar</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalSkills} skill{totalSkills !== 1 ? 's' : ''} available across{' '}
            {activeNeighborhoods} neighborhood{activeNeighborhoods !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-gray-300" /> No skills
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-green-300" /> 1–2 skills
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500" /> 3–7 skills
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-green-700" /> 8+ skills
        </span>
      </div>

      {/* Map */}
      <div className="w-full rounded-xl border border-gray-200 overflow-hidden" style={{ height: '520px' }}>
        <RadarLoader locations={locationData} />
      </div>

      {/* Neighborhood list */}
      {locationData.filter((l) => l.skillCount > 0).length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Active neighborhoods</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {locationData
              .filter((l) => l.skillCount > 0)
              .sort((a, b) => b.skillCount - a.skillCount)
              .map((loc) => (
                <a
                  key={loc.id}
                  href={`/skills?locationId=${loc.id}`}
                  className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2.5 hover:border-green-400 hover:shadow-sm transition-all"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{loc.neighborhood}</p>
                    <p className="text-xs text-gray-400">{loc.city}</p>
                  </div>
                  <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                    {loc.skillCount}
                  </span>
                </a>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
