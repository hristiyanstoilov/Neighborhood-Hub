'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth'
import { ProfilePageSkeleton } from '@/components/ui/skeletons'
import EditProfileForm from './edit-profile-form'

interface Location {
  id: string
  city: string
  neighborhood: string
}

export function EditProfileClient() {
  const { user } = useAuth()
  const [locations, setLocations] = useState<Location[] | null>(null)
  const [locationError, setLocationError] = useState(false)
  const [loadingLocations, setLoadingLocations] = useState(false)

  const loadLocations = useCallback(async () => {
    setLocationError(false)
    setLoadingLocations(true)

    try {
      const res = await fetch('/api/locations', { credentials: 'include' })
      if (!res.ok) {
        throw new Error('Failed to load locations')
      }

      const json = await res.json()
      setLocations(json.data)
    } catch {
      setLocationError(true)
    } finally {
      setLoadingLocations(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      void loadLocations()
    }
  }, [user, loadLocations])

  if (!locations && !locationError) {
    return <ProfilePageSkeleton />
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Edit profile</h1>
      {locationError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>Failed to load locations. Please try again.</p>
          <button
            type="button"
            onClick={() => void loadLocations()}
            disabled={loadingLocations}
            className="mt-3 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
          >
            {loadingLocations ? 'Retrying…' : 'Retry'}
          </button>
        </div>
      ) : (
        <EditProfileForm profile={user?.profile ?? null} locations={locations ?? []} />
      )}
    </div>
  )
}
