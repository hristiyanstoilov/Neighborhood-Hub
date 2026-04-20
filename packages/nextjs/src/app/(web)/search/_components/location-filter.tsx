'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

type LocationOption = {
  id: string
  city: string
  neighborhood: string
}

type LocationFilterProps = {
  value?: string
  onChange: (value?: string) => void
}

export function LocationFilter({ value, onChange }: LocationFilterProps) {
  const [locations, setLocations] = useState<LocationOption[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadLocations() {
      const res = await apiFetch('/api/locations')
      if (!res.ok) return

      const json = await res.json().catch(() => null)
      if (!json || cancelled) return
      setLocations((json.data ?? []) as LocationOption[])
    }

    void loadLocations()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <select
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value || undefined)}
      className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
    >
      <option value="">All neighborhoods</option>
      {locations.map((location) => (
        <option key={location.id} value={location.id}>
          {location.neighborhood}, {location.city}
        </option>
      ))}
    </select>
  )
}
