'use client'

import { useTranslations } from 'next-intl'
import { useAuth } from '@/contexts/auth'
import { ProfilePageSkeleton } from '@/components/ui/skeletons'
import EditProfileForm from './edit-profile-form'
import { useEditProfileData } from './_hooks/use-edit-profile-data'

export function EditProfileClient() {
  const { user, loading } = useAuth()
  const locationsQuery = useEditProfileData(Boolean(user))
  const t = useTranslations('edit_profile')

  if (loading || !user || locationsQuery.isLoading) {
    return <ProfilePageSkeleton />
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      {locationsQuery.isError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{t('locations_error')}</p>
          <button
            type="button"
            onClick={() => void locationsQuery.refetch()}
            disabled={locationsQuery.isFetching}
            className="mt-3 rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
          >
            {locationsQuery.isFetching ? t('retrying') : t('retry')}
          </button>
        </div>
      ) : (
        <EditProfileForm profile={user?.profile ?? null} locations={locationsQuery.data ?? []} />
      )}
    </div>
  )
}
