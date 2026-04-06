'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth'
import { apiFetch } from '@/lib/api'

interface Profile {
  name: string | null
  bio: string | null
  avatarUrl: string | null
  locationId: string | null
  isPublic: boolean
}

interface Location { id: string; city: string; neighborhood: string }

interface Props {
  profile: Profile | null
  locations: Location[]
}

export default function EditProfileForm({ profile, locations }: Props) {
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const form = new FormData(e.currentTarget)
      const body = {
        name:       (form.get('name') as string).trim() || undefined,
        bio:        (form.get('bio') as string).trim() || undefined,
        avatarUrl:  (form.get('avatarUrl') as string).trim() || undefined,
        locationId: (form.get('locationId') as string) || undefined,
        isPublic:   form.get('isPublic') === 'true',
      }

      const res = await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(body),
      })

      const json = await res.json()

      if (!res.ok) {
        const msg: Record<string, string> = {
          VALIDATION_ERROR:   'Please check your inputs.',
          LOCATION_NOT_FOUND: 'Selected location is invalid.',
          TOO_MANY_REQUESTS:  'Too many attempts. Please wait and try again.',
        }
        setError(msg[json.error] ?? 'Something went wrong. Please try again.')
        return
      }

      // Refresh auth context so nav shows the updated name
      await refreshUser()
      router.push('/profile')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-5">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            name="name"
            type="text"
            maxLength={100}
            defaultValue={profile?.name ?? ''}
            placeholder="Your display name"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            name="bio"
            rows={3}
            maxLength={500}
            defaultValue={profile?.bio ?? ''}
            placeholder="A short description about yourself…"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">Max 500 characters.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Avatar URL</label>
          <input
            name="avatarUrl"
            type="url"
            maxLength={2048}
            defaultValue={profile?.avatarUrl ?? ''}
            placeholder="https://example.com/avatar.jpg"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <select
            name="locationId"
            defaultValue={profile?.locationId ?? ''}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="">— Select location —</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>{l.neighborhood}, {l.city}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Profile visibility</label>
          <select
            name="isPublic"
            defaultValue={profile?.isPublic === false ? 'false' : 'true'}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="true">Public</option>
            <option value="false">Private</option>
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-green-700 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-green-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Saving…' : 'Save changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/profile')}
            className="px-5 py-2 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
