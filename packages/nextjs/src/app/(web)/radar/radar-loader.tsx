'use client'

import dynamic from 'next/dynamic'

interface LocationPin {
  id: string
  city: string
  neighborhood: string
  lat: string
  lng: string
  skillCount: number
}

// dynamic import with ssr:false must be in a Client Component
const RadarMap = dynamic(() => import('./radar-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-xl">
      <p className="text-sm text-gray-400">Loading map…</p>
    </div>
  ),
})

export default function RadarLoader({ locations }: { locations: LocationPin[] }) {
  return <RadarMap locations={locations} />
}
