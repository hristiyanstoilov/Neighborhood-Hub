'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { MapMarker } from '@/app/api/map/route'

// Sofia center
const SOFIA_CENTER: [number, number] = [42.698, 23.322]
const DEFAULT_ZOOM = 12

const TYPE_CONFIG: Record<MapMarker['type'], { color: string; label: string; href: string }> = {
  skill:      { color: '#15803d', label: 'Skill',  href: '/skills' },
  tool:       { color: '#1d4ed8', label: 'Tool',   href: '/tools' },
  food_share: { color: '#ea580c', label: 'Food',   href: '/food' },
  event:      { color: '#7c3aed', label: 'Event',  href: '/events' },
}

function makeIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -10],
  })
}

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap()
  useEffect(() => {
    if (markers.length === 0) return
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]))
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 })
  }, [markers, map])
  return null
}

type FilterType = MapMarker['type'] | 'all'

const FILTER_OPTIONS: { value: FilterType; label: string; color: string }[] = [
  { value: 'all',        label: 'All',    color: '#374151' },
  { value: 'skill',      label: 'Skills', color: '#15803d' },
  { value: 'tool',       label: 'Tools',  color: '#1d4ed8' },
  { value: 'food_share', label: 'Food',   color: '#ea580c' },
  { value: 'event',      label: 'Events', color: '#7c3aed' },
]

interface Props {
  markers: MapMarker[]
  error: boolean
}

export default function MapView({ markers, error }: Props) {
  const [filter, setFilter] = useState<FilterType>('all')

  const visible = filter === 'all' ? markers : markers.filter((m) => m.type === filter)

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500 text-sm">
        Could not load map data. Please refresh.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setFilter(opt.value)}
            style={filter === opt.value ? { backgroundColor: opt.color, borderColor: opt.color, color: '#fff' } : {}}
            className="px-3 py-1 text-xs rounded-full border border-gray-300 text-gray-600 hover:border-gray-400 transition-colors"
          >
            {opt.label}
            {opt.value !== 'all' && (
              <span className="ml-1 opacity-70">
                ({markers.filter((m) => m.type === opt.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="flex-1 rounded-lg overflow-hidden border border-gray-200 min-h-[500px]">
        <MapContainer
          center={SOFIA_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds markers={visible} />
          {visible.map((m) => {
            const cfg = TYPE_CONFIG[m.type]
            return (
              <Marker key={`${m.type}-${m.id}`} position={[m.lat, m.lng]} icon={makeIcon(cfg.color)}>
                <Popup>
                  <div className="text-sm min-w-[160px]">
                    <span
                      className="inline-block text-xs px-2 py-0.5 rounded-full text-white mb-1"
                      style={{ backgroundColor: cfg.color }}
                    >
                      {cfg.label}
                    </span>
                    <p className="font-semibold text-gray-900 mb-0.5">{m.title}</p>
                    <p className="text-xs text-gray-500 mb-2">{m.neighborhood}</p>
                    <a
                      href={`${cfg.href}/${m.id}`}
                      className="text-xs font-medium text-green-700 hover:underline"
                    >
                      View →
                    </a>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      <p className="text-xs text-gray-400 mt-2 text-right">
        Showing {visible.length} of {markers.length} items
      </p>
    </div>
  )
}
