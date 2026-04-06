'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return <p className="text-gray-400 text-sm">Loading…</p>
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <Link
          href="/profile/edit"
          className="px-4 py-1.5 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Edit profile
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-4">
          {user.profile?.avatarUrl ? (
            <img
              src={user.profile.avatarUrl}
              alt={user.profile.name ?? 'Avatar'}
              className="w-14 h-14 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-xl">
              {(user.profile?.name ?? user.email)[0].toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{user.profile?.name ?? '—'}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <dl className="divide-y divide-gray-100 text-sm">
          <div className="py-3 flex justify-between">
            <dt className="text-gray-500">Role</dt>
            <dd className="font-medium capitalize">{user.role}</dd>
          </div>
          <div className="py-3 flex justify-between">
            <dt className="text-gray-500">Email verified</dt>
            <dd className={user.emailVerifiedAt ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>
              {user.emailVerifiedAt ? 'Yes' : 'Not verified'}
            </dd>
          </div>
          <div className="py-3 flex justify-between">
            <dt className="text-gray-500">Profile visibility</dt>
            <dd className="font-medium">
              {user.profile?.isPublic === false ? 'Private' : 'Public'}
            </dd>
          </div>
          {user.profile?.bio && (
            <div className="py-3">
              <dt className="text-gray-500 mb-1">Bio</dt>
              <dd className="text-gray-700">{user.profile.bio}</dd>
            </div>
          )}
        </dl>

        {!user.emailVerifiedAt && (
          <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
            Your email is not verified. You cannot create skill listings until you verify it.
          </p>
        )}
      </div>
    </div>
  )
}
