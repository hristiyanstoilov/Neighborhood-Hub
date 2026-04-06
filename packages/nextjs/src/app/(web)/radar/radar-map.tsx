'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import Link from 'next/link'
import 'leaflet/dist/leaflet.css'

interface LocationPin {
  id: string
  city: string
  neighborhood: string
  lat: string
  lng: string
  skillCount: number
}

interface Props {
  locations: LocationPin[]
}

function markerColor(count: number): string {
  if (count === 0) return '#d1d5db'   // gray
  if (count < 3)  return '#86efac'   // light green
  if (count < 8)  return '#22c55e'   // green
  return '#15803d'                    // dark green
}

function markerRadius(count: number): number {
  if (count === 0) return 6
  if (count < 3)  return 9
  if (count < 8)  return 13
  return 18
}

export default function RadarMap({ locations }: Props) {
  // Sofia center
  const center: [number, number] = [42.6977, 23.3219]

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {locations.map((loc) => {
        const lat = parseFloat(loc.lat)
        const lng = parseFloat(loc.lng)
        if (isNaN(lat) || isNaN(lng)) return null

        return (
          <CircleMarker
            key={loc.id}
            center={[lat, lng]}
            radius={markerRadius(loc.skillCount)}
            pathOptions={{
              fillColor: markerColor(loc.skillCount),
              fillOpacity: 0.85,
              color: '#fff',
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-sm min-w-[140px]">
                <p className="font-semibold text-gray-900 mb-1">
                  {loc.neighborhood}
                </p>
                <p className="text-gray-500 text-xs mb-2">{loc.city}</p>
                {loc.skillCount > 0 ? (
                  <>
                    <p className="text-green-700 font-medium text-xs mb-2">
                      {loc.skillCount} skill{loc.skillCount !== 1 ? 's' : ''} available
                    </p>
                    <a
                      href={`/skills?locationId=${loc.id}`}
                      className="block text-center bg-green-700 text-white text-xs px-3 py-1.5 rounded-md hover:bg-green-800 transition-colors"
                    >
                      View skills →
                    </a>
                  </>
                ) : (
                  <p className="text-gray-400 text-xs">No skills available yet.</p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
