'use client'

import { useAuth } from '@/contexts/auth'
import { ProfilePageSkeleton } from '@/components/ui/skeletons'
import EditProfileForm from './edit-profile-form'
import { useEditProfileData } from './_hooks/use-edit-profile-data'

export function EditProfileClient() {
  const { user, loading } = useAuth()
  const locationsQuery = useEditProfileData(Boolean(user))

  if (loading || !user || locationsQuery.isLoading) {
    return <ProfilePageSkeleton />
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Edit profile</h1>
      {locationsQuery.isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>Failed to load locations. Please try again.</p>
          <button
            type="button"
            onClick={() => void locationsQuery.refetch()}
            disabled={locationsQuery.isFetching}
            className="mt-3 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
          >
            {locationsQuery.isFetching ? 'Retrying…' : 'Retry'}
          </button>
        </div>
      ) : (
        <EditProfileForm profile={user?.profile ?? null} locations={locationsQuery.data ?? []} notificationsEnabled={user?.notificationsEnabled ?? true} />
      )}
    </div>
  )
}
