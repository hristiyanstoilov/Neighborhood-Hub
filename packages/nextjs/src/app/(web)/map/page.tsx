'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api'
import type { MapMarker } from '@/app/api/map/route'

const MapView = dynamic(() => import('./_components/map-view'), { ssr: false })

export default function MapPage() {
  const t = useTranslations('map')
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    apiFetch('/api/map')
      .then((res) => res.json())
      .then((json) => {
        setMarkers(Array.isArray(json?.data) ? json.data : [])
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('page_title')}</h1>
        {!loading && !error && (
          <p className="text-sm text-gray-500">{t('items_near', { count: markers.length })}</p>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1">
          <MapView markers={markers} error={error} />
        </div>
      )}
    </div>
  )
}
