import { apiFetch } from '../api'

export interface RadarLocationPin {
  id: string
  city: string
  neighborhood: string
  lat: string
  lng: string
  skillCount: number
}

export const radarKeys = {
  all: ['radar'] as const,
  locations: () => [...radarKeys.all, 'locations'] as const,
}

function readErrorCode(json: unknown): string {
  if (json && typeof json === 'object' && 'error' in json && typeof (json as { error?: unknown }).error === 'string') {
    return (json as { error: string }).error
  }

  return 'UNKNOWN_ERROR'
}

export async function fetchRadarLocations(): Promise<RadarLocationPin[]> {
  const res = await apiFetch('/api/locations')
  const json = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(readErrorCode(json))
  }

  const rows: unknown[] = Array.isArray(json?.data) ? json.data : []

  return rows
    .filter((row: unknown): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
    .map((row: Record<string, unknown>) => ({
      id: typeof row.id === 'string' ? row.id : '',
      city: typeof row.city === 'string' ? row.city : '',
      neighborhood: typeof row.neighborhood === 'string' ? row.neighborhood : '',
      lat: typeof row.lat === 'string' ? row.lat : '',
      lng: typeof row.lng === 'string' ? row.lng : '',
      skillCount: typeof row.skillCount === 'number' ? row.skillCount : 0,
    }))
    .filter((row: RadarLocationPin) => row.id.length > 0)
}